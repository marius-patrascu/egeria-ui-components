import { useState, useEffect } from 'react';
import {Checkbox, TextInput, MultiSelect, Button, LoadingOverlay, Alert} from '@mantine/core';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import QualifiedName from './qualified-name';
import DisplayNameCellRenderer from './displayNameCellRenderer';

import {
  ASSET_CATALOG_PATH,
  PAGE_SIZE_INCREASE_VALUE,
  formData,
  getQueryParams,
  getQueryParamsPath,
  fetchTypes,
  fetchRawData
} from '@lfai/egeria-js-commons';
import {AlertCircle} from 'tabler-icons-react';

/**
 * Initial empty form value.
 */
const emptyForm: formData = {
  q: '',
  types: [] as any,
  exactMatch: false,
  caseSensitive: false,
  pageSize: 25
};

/**
 * Initial types data value.
 */
const emptyTypesData: Array<any> = [];

interface Props {
  apiUrl?: string;
}

export function EgeriaAssetCatalog(props: Props) {
  const { apiUrl } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = getQueryParams(searchParams);
  const navigate = useNavigate();

  const [typesData, setTypesData] = useState({
    isLoading: false,
    typesData: [...emptyTypesData, ...queryParams.types]
  } as any);

  const [searchValidationInfo, setErrorSearchValidationInfo] = useState(
      {
        isError: false,
        errorMessage: ''
      } as any
  );


  const [form, setForm] = useState({
    ...emptyForm,
    ...queryParams
  } as any);

  const [rowData, setRowData] = useState({
    isLoading: false,
    rowData: [] as any
  });

  /*
   * Contains AGGrid data-table information and config.
   */
  const gridOptions = {
    suppressCellFocus: true,
    defaultColDef: {
      sortable: true,
      resizable: true,
      minWidth: 150
    },
    columnDefs: [
      {
        field: 'properties.displayName',
        filter: true,
        headerName: 'Name',
        cellRenderer: (params: any) => {
          return <DisplayNameCellRenderer apiUrl={apiUrl} data={params.data}/>;
        }
      },
      {field: 'origin.metadataCollectionName', filter: true, headerName: 'Origin' },
      {field: 'type.name', filter: true, headerName: 'Type' },
      {
        field: 'properties.qualifiedName',
        filter: true,
        headerName: 'Context Info',
        cellRenderer: (params: any) => {
          return <QualifiedName qualified={params.value}/>;
        }
      },
      {field: 'properties.summary', filter: true, headerName: 'Description' }
    ],
    onFirstDataRendered: (params: any) => {
      const allColumnIds: string[] = [];

      params.columnApi.getColumns()?.forEach((column: any) => {
        allColumnIds.push(column.getId());
      });

      params.columnApi.autoSizeColumns(allColumnIds, true);
    }
  };

  useEffect(() => {
    const _queryParams = getQueryParams(searchParams);

    setForm({
      ..._queryParams
    });

  }, [searchParams]);


  useEffect(() => {
    setTypesData({...typesData, isLoading: true});

    const bringTypes = async () => {
      const rawTypesData = await fetchTypes(apiUrl);

      setTypesData({
        isLoading: false,
        typesData: [...rawTypesData]
      });
    };

    bringTypes();
  }, []);

  useEffect(() => {
    const _queryParams = getQueryParams(searchParams);

    setRowData({...rowData, isLoading: true});

    const queryData = async () => {
      const _rowData = await fetchRawData({...form, ..._queryParams}, apiUrl);

      setRowData({
        isLoading: false,
        rowData: [
          ..._rowData
        ]
      });
    };

    queryData();
  }, [searchParams]);


  const areParamsValid = ()  => {
    const query: string = form.q
    if (query.length < 3) {
      setErrorSearchValidationInfo({
        isError :true,
        errorMessage : 'The query must be at least 3 characters long'
      });
      return false;
    }
    const types : Array<string> = form.types;
    if (!types || types.length === 0) {
      setErrorSearchValidationInfo({
        isError :true,
        errorMessage : 'You must select at least one type'
      })
      return false;
    }
    return true;
  }

  /*
   * Submit handler for the main form.
   */
  const submit = () => {

    if (areParamsValid() && searchValidationInfo.isError) {
      setErrorSearchValidationInfo({
        isError :false,
        errorMessage : ''
      })
    }
    if (areParamsValid()) {
      setSearchParams(form);
    }
  };

  /*
   * Submit handler for the main form on ENTER keypress.
   */
  const handleEnterPress = (e: any) => {
    if(e.key === 'Enter') {
      submit();
    }
  };

  /*
   * Load more handler for loading more elements, pagintation.
   */
  const loadMore = () => {
    const newPageSize = form.pageSize + PAGE_SIZE_INCREASE_VALUE;
    const newFormData = {...form, pageSize: newPageSize};

    // TODO: check if last page (new array === last data array)
    setForm({
      ...newFormData
    });

    goTo(newFormData);
  };

  /*
   * Method used to update current browser's URL.
   */
  const goTo = (formData: formData) => {
    const path = ASSET_CATALOG_PATH;
    const queryParams = getQueryParamsPath(formData);

    navigate(`${path}${queryParams.length ? `?${queryParams.join('&')}` : ''}` );
  };

  return (
    <>
    <div style={{ display: 'flex', alignItems: 'stretch', flexDirection: 'column', position: 'relative', height: '100%', }}>
      <LoadingOverlay visible={rowData.isLoading || typesData.isLoading} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}>
        <TextInput mr="xl"
                   style={{minWidth: 180}}
                   placeholder="Search"
                   value={form.q}
                   minLength={2}
                   onKeyPress={handleEnterPress}
                   onChange={(event: any) => setForm({...form, q: event.currentTarget.value})} />

        <MultiSelect mr="xl"
                     style={{minWidth: 230}}
                     data={typesData.typesData}
                     value={form.types}
                     placeholder="Types"
                     onChange={(value) => setForm({...form, types: [...value]})} />

        <Checkbox mr="xl"
                  label={'Exact match'}
                  checked={form.exactMatch}
                  onChange={(event) => setForm({...form, exactMatch: event.currentTarget.checked})} />

        <Checkbox mr="xl"
                  label={'Case sensitive'}
                  checked={form.caseSensitive}
                  onChange={(event) => setForm({...form, caseSensitive: event.currentTarget.checked})} />

        <Button onClick={() => submit()}>
          Search
        </Button>

      </div>
      <div>
        {searchValidationInfo.isError &&
        <Alert icon={<AlertCircle size={16}/>} color="red">
          {<p>{searchValidationInfo.errorMessage}</p>}
        </Alert>
        }
      </div>
      <div className="ag-theme-alpine" style={{width: '100%', height: '100%'}}>
        <AgGridReact gridOptions={gridOptions}
                     rowData={rowData.rowData} />
      </div>

      <div>
        <Button size="xs" compact fullWidth onClick={() => loadMore()} style={{marginBottom:1, marginTop:10}}>
          Load more...
        </Button>
      </div>
    </div>
    </>
  );
}

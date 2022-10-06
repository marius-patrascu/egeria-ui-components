var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Checkbox, TextInput, MultiSelect, Button, LoadingOverlay } from '@mantine/core';
import { authHeader, egeriaFetch } from 'egeria-js-commons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import QualifiedName from './qualified-name';
import DisplayNameCellRenderer from './displayNameCellRenderer';
const QUERY_MIN_LENGTH = 3;
const TYPES_MIN_SELECTED = 1;
const PAGE_SIZE_INCREASE_VALUE = 25;
const emptyForm = {
    q: '',
    types: [],
    exactMatch: false,
    caseSensitive: false,
    pageSize: 25
};
const emptyTypesData = [];
const getQueryParams = (searchParams) => {
    var _a;
    return {
        q: searchParams.get('q') || '',
        types: ((_a = searchParams.get('types')) === null || _a === void 0 ? void 0 : _a.split(',')) || [],
        exactMatch: searchParams.get('exactMatch') === "true" ? true : false,
        caseSensitive: searchParams.get('caseSensitive') === "true" ? true : false,
        pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')) : PAGE_SIZE_INCREASE_VALUE
    };
};
const getQueryParamsPath = (formData) => {
    const { q, exactMatch, caseSensitive, types, pageSize } = formData;
    let queryParams = [];
    if (q) {
        queryParams.push(`q=${q}`);
    }
    if (types && types.length > 0) {
        queryParams.push(`types=${types.join(',')}`);
    }
    if (exactMatch) {
        queryParams.push(`exactMatch=true`);
    }
    if (caseSensitive) {
        queryParams.push(`caseSensitive=true`);
    }
    if (types) {
        queryParams.push(`pageSize=${pageSize}`);
    }
    return queryParams;
};
const fetchData = (uri, method, callback) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield egeriaFetch(uri, method, Object.assign({}, authHeader()), {});
    const data = yield res.json();
    if (callback) {
        callback(data);
    }
    else {
        return data;
    }
});
const fetchRawData = (formData, apiUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const { q, types } = formData;
    if (q.length >= QUERY_MIN_LENGTH && types.length >= TYPES_MIN_SELECTED) {
        const _queryParams = getQueryParamsPath(formData);
        const path = `${apiUrl || ''}/api/assets/search${_queryParams.length ? `?${_queryParams.join('&')}` : ``}`;
        const rawData = yield fetchData(path, 'GET');
        return rawData;
    }
    else {
        return [];
    }
});
const fetchTypes = (apiUrl) => __awaiter(void 0, void 0, void 0, function* () {
    let typesData = yield fetchData(`${apiUrl || ''}/api/assets/types`, 'GET');
    typesData = [
        ...typesData.map((d) => {
            return {
                value: d.name,
                label: d.name
            };
        })
    ];
    return typesData;
});
const initData = (formData, callback, apiUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const typesData = yield fetchTypes(apiUrl);
    const rawData = yield fetchRawData(formData, apiUrl);
    if (callback) {
        callback({ types: typesData, rawData: rawData });
    }
});
export function EgeriaAssetCatalog(props) {
    // const [ URLSearchParams ] = useSearchParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParams = getQueryParams(searchParams);
    // const { q, types, exactMatch, caseSensitive, pageSize } = searchParams;
    // console.log(q, types, exactMatch, caseSensitive, pageSize);
    const navigate = useNavigate();
    const [data, setData] = useState({
        isLoading: false,
        typesData: [...emptyTypesData, ...queryParams.types],
        form: Object.assign(Object.assign({}, emptyForm), queryParams),
        rowData: []
    });
    const { isLoading, rowData, typesData } = data;
    useEffect(() => {
        const _queryParams = getQueryParams(searchParams);
        setData(Object.assign(Object.assign({}, data), { form: Object.assign({}, _queryParams) }));
    }, [searchParams]);
    // const [isLoading, setIsLoading] = useState(false);
    // const [typesData, setTypesData] = useState([...emptyTypesData, ...queryParams.types]);
    // const [formData, setFormData] = useState({...emptyForm, ...queryParams});
    // const [userFormData, setUserFormData] = useState({...emptyForm, ...queryParams});
    // const [rowData, setRowData]: any = useState([]);
    const { apiUrl } = props;
    // const { exactMatch, caseSensitive, q, types } = userFormData;
    // const { pageSize } = formData;
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
                cellRenderer: (params) => {
                    return _jsx(DisplayNameCellRenderer, { apiUrl: apiUrl, data: params.data });
                }
            },
            { field: 'origin.metadataCollectionName', filter: true, headerName: 'Origin' },
            { field: 'type.name', filter: true, headerName: 'Type' },
            {
                field: 'properties.qualifiedName',
                filter: true,
                headerName: 'Context Info',
                cellRenderer: (params) => {
                    return _jsx(QualifiedName, { qualified: params.value });
                }
            },
            { field: 'properties.summary', filter: true, headerName: 'Description' }
        ],
        onFirstDataRendered: (params) => {
            const allColumnIds = [];
            params.columnApi.getColumns().forEach((column) => {
                allColumnIds.push(column.getId());
            });
            params.columnApi.autoSizeColumns(allColumnIds, true);
        }
    };
    // useEffect(() => {
    //   const bringTypes = async () => {
    //     const rawTypesData = await fetchTypes(apiUrl);
    //     setData({...data, typesData: [...rawTypesData]});
    //   };
    //   bringTypes();
    // }, []);
    // useEffect(() => {
    //   const { form } = data;
    //   setData({...data, isLoading: true});
    //   const queryData = async () => {
    //     const rowData = await fetchRawData(form, apiUrl);
    //     setData({
    //       ...data,
    //       isLoading: false,
    //       rowData: [...rowData],
    //       form: {
    //         ...queryParams
    //       }
    //     });
    //   };
    //   queryData();
    // }, [URLSearchParams]);
    // const submit = async () => {
    //   const { form } = data;
    //   goTo(form);
    //   // setData({
    //   //   ...data,
    //   //   isLoading: true,
    //   //   form: {
    //   //     ...form
    //   //   }
    //   // });
    //   // const rowData = await fetchRawData(form, apiUrl);
    //   // setData({
    //   //   ...data,
    //   //   isLoading: false,
    //   //   rowData: [...rowData]
    //   // });
    // };
    const submit = () => {
        const { form } = data;
        setSearchParams(form);
        console.log('submitted');
    };
    const handleEnterPress = (e) => {
        if (e.key === 'Enter') {
            submit();
        }
    };
    const loadMore = () => { };
    // const loadMore = () => {
    //   const { form } = data;
    //   const newPageSize = form.pageSize + PAGE_SIZE_INCREASE_VALUE;
    //   const newFormData = {...form, pageSize: newPageSize};
    //   // TODO: check if last page (new array === last data array)
    //   setData({
    //     ...data,
    //     form: {
    //       ...newFormData
    //     }
    //   });
    //   goTo(newFormData);
    // };
    // const goTo = (formData: formData) => {
    //   const path = `/assets/catalog`;
    //   const queryParams = getQueryParamsPath(formData);
    //   navigate(`${path}${queryParams.length ? `?${queryParams.join('&')}` : ``}` );
    // };
    console.log('data = ', data);
    return (_jsx(_Fragment, { children: _jsxs("div", Object.assign({ style: { display: 'flex', alignItems: 'stretch', flexDirection: 'column', position: 'relative', height: '100%', } }, { children: [_jsx(LoadingOverlay, { visible: isLoading }), _jsxs("div", Object.assign({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } }, { children: [_jsx(TextInput, { mr: "xl", style: { minWidth: 180 }, placeholder: "Search", value: data.form.q, onKeyPress: handleEnterPress, onChange: (event) => setData(Object.assign(Object.assign({}, data), { form: Object.assign(Object.assign({}, data.form), { q: event.currentTarget.value }) })) }), _jsx(MultiSelect, { mr: "xl", style: { minWidth: 230 }, data: typesData, value: data.form.types, placeholder: "Types", onChange: (value) => setData(Object.assign(Object.assign({}, data), { form: Object.assign(Object.assign({}, data.form), { types: [...value] }) })) }), _jsx(Checkbox, { mr: "xl", label: 'Exact match', checked: data.form.exactMatch, onChange: (event) => setData(Object.assign(Object.assign({}, data), { form: Object.assign(Object.assign({}, data.form), { exactMatch: event.currentTarget.checked }) })) }), _jsx(Checkbox, { mr: "xl", label: 'Case sensitive', checked: data.form.caseSensitive, onChange: (event) => setData(Object.assign(Object.assign({}, data), { form: Object.assign(Object.assign({}, data.form), { caseSensitive: event.currentTarget.checked }) })) }), _jsx(Button, Object.assign({ onClick: () => submit() }, { children: "Search" }))] })), _jsx("div", Object.assign({ className: "ag-theme-alpine", style: { width: '100%', height: '100%' } }, { children: _jsx(AgGridReact, { gridOptions: gridOptions, rowData: rowData }) })), _jsx("div", { children: _jsx(Button, Object.assign({ size: "xs", compact: true, fullWidth: true, onClick: () => loadMore(), style: { marginBottom: 1, marginTop: 10 } }, { children: "Load more..." })) })] })) }));
}

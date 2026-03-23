import {
    Box,
    Typography
} from "@mui/material";
import { useEffect, useState} from "react";
import axios from "axios";
import EditorToolbar from "../toolbars/EditorToolbar.jsx";
import {StyledDataGrid} from "../base/StyledDataGrid.jsx";
import {GridActionsCellItem, useGridApiRef} from "@mui/x-data-grid";
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import {useTreeViewApiRef } from "@mui/x-tree-view";
import useEntityConfigurationStore from "../stores/EntityConfigurationStore.jsx";
import EditedConfigurationTreeItem from "../base/EditedConfigurationTreeItem.jsx";

export default function DevicesEditor(
    {
        preloaded = [],
        onEntityClicked=(entity)=>{},
        selectedEntitiesMap = new Map(),
        setSelectedEntitiesMap = (map) => {},
        editedEntitiesMap = new Map(),
        setEditedEntitiesMap = (map) => {},
        setEntitiesToDeviceMap = (map) => {}
    }
){
    const gridApiRef = useGridApiRef();
    //handlers
    const onClickEditingHandler = (id) => {
        console.log({'Editing device id': id});
    }
    // states for boolean
    const [loading, setLoading] = useState(false);
    const [applyFilter, setApplyFilter] = useState(true);
    // const [ ]
    // states for arrays
    const [devices, setDevices] = useState(
        [
            {id: 1, name: 'Device 1', entities: ['E1', 'E2'], entitiesExpanded: false},
            {id: 2, name: 'Device 2', entities: ['E1', 'E2'], entitiesExpanded: false},
            {id: 3, name: 'Device 3', entities: ['E1', 'E2', 'E3'], entitiesExpanded: false}
        ]
    )
    // stays empty initially
    const [filteredDevices, setFilteredDevices] = useState(
        [
            {}
        ]
    );
    const [filterWords, setFilterWords] = useState([
        'home assistant supervisor',
        'home assistant add-on',
        'home assistant core',
        'home assistant operating system',
        'bridge',
    ]);

    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            width: 450,
            renderCell: (params)=>{
                const { value, row } = params;
                const treeviewApiRef = useTreeViewApiRef();
                // console.log(params);
                // const id = 0
                const children = row.entities.map((entity) => {
                    return { id: entity, label: entity };
                })
                const entry = [{
                    id : 'root',
                    label: value,
                    children: children
                }]

                const onCheckedHandler = (entity, state) => {
                    // remove on uncheck
                    console.log(` ${ (state)? 'add' : 'remove' } ${ entity } from map `);
                    const map = selectedEntitiesMap;
                    if(!state) {
                        if(selectedEntitiesMap.has(entity))
                            map.delete(entity);
                        setSelectedEntitiesMap(new Map(map));
                    }else{
                        //set an empty entry that indicate to fetch this information from the remote api
                        // selectedEntitiesMap.set(entity, null);
                        //fetch if no entry exists
                        axios.get(
                            `/api/states/${entity}`,
                            {
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                        ).then((response)=> {
                            const { data } = response;
                            map.set(entity, data);
                        }).catch((error)=> {
                            console.error(error);
                        }).finally(()=>{
                            setSelectedEntitiesMap(new Map(map));
                            onEntityClicked({entityId: entity});
                        });
                    }
                };

                const expandedItems = (params.row.entitiesExpanded) ? ['root'] : [];

                return <RichTreeView
                    items={entry}
                    expandedItems={
                        expandedItems
                    }
                    apiRef={treeviewApiRef}
                    slots={
                        {
                            // expandIcon: AddBoxIcon,
                            item: EditedConfigurationTreeItem
                        }
                    }
                    slotProps={{
                        item: {
                            //illustrate how to forward a property to a tree item
                            // randomNumber : Math.floor(Math.random() * 10),
                            // selectedEntities: selectedEntitiesMap,
                            // setSelectedEntitiesMap: setSelectedEntitiesMap,
                            // checked: false,
                            onEntityClicked: onEntityClicked,
                            selectedEntitiesMap: selectedEntitiesMap,
                            editedEntitiesMap: editedEntitiesMap,
                            onChecked: onCheckedHandler,
                        }
                    }}
                    // checkboxSelection
                    itemChildrenIndentation={0}
                    onItemExpansionToggle={
                        (event)=> {
                            row.entitiesExpanded = !row.entitiesExpanded;
                            gridApiRef.current.updateRows([row]);
                            if (!row.entitiesExpanded) {
                                setTimeout(
                                    ()=>  treeviewApiRef.current.selectItem({event: event, itemId: 'root'}),
                                    100
                                );
                            }
                        }
                    }
                    onItemSelectionToggle={
                        // this entity is selected but not yet checked
                        (event, itemId, isSelected)=>{
                            if(itemId === 'root' /*|| !isSelected*/)
                                return;
                            console.log('toggled!')
                            onEntityClicked({entityId: itemId});
                        }
                    }
                    onItemClick={
                        (event, itemId, isSelected)=>{
                            if(itemId === 'root' || !isSelected)
                                return;
                            console.log('clicked!')
                        }
                    }
                />
            }
        },
        { field: 'model', headerName: 'Model', width: 300},
        {
            field: 'entities',
            headerName: 'Entities',
            width: 300,
        },
    ];
    // fetch all devices from the SHH
    useEffect(()=>{
        setLoading(()=>true);
        console.log('fetch devices')
        axios.post(
            '/api/template',{
                "template" : "{% set devices = states | map(attribute=\"entity_id\") | map(\"device_id\") | unique | reject(\"eq\",None) | list %}{%- set ns = namespace(devices = []) %}{%- for device in devices %}{%- set entities = device_entities(device) | list %}{%- if entities %}{%- set ns.devices = ns.devices +  [ {\"id\":device,\"name\": device_attr(device, \"name\"), \"entities\": entities, \"model\": device_attr(device,\"model\"), \"suggested_area\":device_attr(device, \"suggested_area\")} ] %}{%- endif %}{%- endfor %}{{ ns.devices | tojson }}"
            },{
                headers: {
                    "content-type": "application/json",
                },
            }
        ).then((response)=>{
            const { data } = response;
            const activated = [];
            const deactivated = [];
            const entitiesToDevice = new Map()

            if (applyFilter) {
                for (let device of data){
                    const jndex = preloaded.findIndex(
                        (element) => {
                            const originalSet = new Set(device.entities)
                            const elementSet = new Set(element.entities);
                            const intersection = originalSet.intersection(elementSet);
                            return intersection.size > 0;
                        }
                    )

                    device.entitiesExpanded = (jndex !== -1)
                    if (device.model == null) {
                        activated.push(device);
                        continue;
                    }
                    // map entities to a device.. required for the update process
                    for (const e of device.entities){
                        if (entitiesToDevice.has(e)) {
                            console.log(`There is already a mapping for entity ${e} to device (${device.id}, ${device.name})`);
                        }
                        entitiesToDevice.set(e, device.id);
                    }
                    //apply filter for confusing devices
                    const index = filterWords.findIndex(
                        (element) => {
                            // console.log({'device.model.toLowerCase()' : device.model.toLowerCase(), 'element': element})
                            return device.model.toLowerCase() === element;
                        }
                    );
                    // // console.log(index)
                    if (index !== -1) {
                        deactivated.push(device);
                        continue;
                    }
                    activated.push(device);
                }
            }
            (applyFilter) ? setDevices(()=>activated) : setDevices(()=>data) ;
            setFilteredDevices(()=>deactivated);
            setEntitiesToDeviceMap(new Map(entitiesToDevice));

        }).catch((error)=>{
            console.error(error);
        }).finally(()=>{
            setLoading(()=>false);
        });
        // deconstruction
        return () => {}
    },[applyFilter]);

    useEffect(()=>{
        setDevices(
            devices.map((device) => {
                const index = preloaded.findIndex(
                    (element) => {
                        const originalSet = new Set(device.entities)
                        const elementSet = new Set(element.entities);
                        const intersection = originalSet.intersection(elementSet);
                        return intersection.size > 0;
                    }
                )
                return (index !== -1) ? { ...device, entitiesExpanded: true } : { ...device, entitiesExpanded: false };
            })
        );
    },[preloaded, loading]);

    //reflect changes from one of the entity configuration into the checkbox of this row
    useEffect(() => {
        useEntityConfigurationStore.subscribe(
            (state)=>state.entityConfigurationsEditedMap,
            () => {
                //assume that the last configuration that has changed is still identical to the one set in
                // entityToEdit property of the EntityConfigurationStore
                const { entityId } = useEntityConfigurationStore.getState().entityToEdit;
                // console.log(`Reflect changes to ${entityId} here by marking the checkbox`);
                for( const { entities, id } of devices ){
                    for (let entity of entities){
                        if (entity !== entityId)
                            continue;
                        gridApiRef.current.selectRow(id);
                        return;
                    }
                }
            }
        )
        return () => {}
    }, [devices]);

    return <>
        {/*<Box sx={{width: '100%', overflow: 'none '}}>*/}
            <Box sx={{ m:1}}>
                <Typography>Select Devices</Typography>
                <StyledDataGrid
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                entities: false
                            },
                        },
                    }}
                    apiRef={gridApiRef}
                    // checkboxSelection
                    rows={devices}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={
                    // handle row selection here
                        () => {
                            //  feedback to the ui that the default configuration is in effect for all entities
                            const selectedRows = gridApiRef.current.getSelectedRows();
                            const selectedEntities = []
                            // console.log({selected: selectedRows});
                            for (const [ key, value ] of selectedRows){
                                selectedEntities.push(...value.entities)
                            }

                            // useEntityConfigurationStore.getState().setEntityConfigurationsSelectedArray(selectedEntities);
                            // //forward the current selection for update operations
                            // useEntityConfigurationStore.getState().setDevicesSelectedMap(selectedRows);
                        }
                    }
                    sx={
                        {
                            m: 2,
                            height: '75vh',
                            maxWidth: 700,
                        }
                    }
                    slots={
                        {
                            toolbar: EditorToolbar
                        }
                    }
                    slotProps={{
                        toolbar: {
                            applyFilter: applyFilter,
                            filterChanged: setApplyFilter,
                            tooltip: `Discard devices from the table that have the 'Model' entry set to: ${ filterWords.join(', ') }`
                        }
                    }}
                    getRowHeight={(params)=>{
                        // expand on demand
                        return (params.model.entitiesExpanded) ?
                            params.densityFactor * (52 +  32 * params.model.entities.length) :
                            52 * params.densityFactor;
                    }}
                />
            </Box>
        {/*</Box>*/}
    </>
}

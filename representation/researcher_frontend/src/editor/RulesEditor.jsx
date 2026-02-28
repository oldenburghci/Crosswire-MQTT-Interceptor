import {Box, Typography} from "@mui/material";
import ToggleSwitch from "../base/ToggleSwitch.jsx";
import {StyledDataGrid} from "../base/StyledDataGrid.jsx";
import {useEffect, useState} from "react";
import axios from "axios";
import EditorToolbar from "../toolbars/EditorToolbar.jsx";
import useRulesStore from "../stores/RulesStore.jsx";

export default function RulesEditor(props) {
    const [ rules, setRules ] = useState(
        [
            {id: 1, name: 'Rule 1', state: 'testState' , internal_id: 1},
            {id: 2, name: 'Rule 2', state: 'testState' , internal_id: 2},
            {id: 3, name: 'Rule 3', state: 'testState' , internal_id: 3},
        ]
    );

    const [ columns ] = useState([
        { field: 'name', headerName: 'Name', width: 300 },
        { field: 'state', headerName: 'Current State', width: 300 },
    ]);

    const [ loading, setLoading ] = useState(true);
    const [ applyFilter, setApplyFilter ] = useState(true);

    useEffect(()=>{
        setLoading(()=> true);
        axios.get(
            '/api/states', {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        ).then((response)=>{
            const { data } = response;
            const fetchedRules = [];
            for (let entity of data){
                if (!entity.entity_id.startsWith('automation.'))
                    continue;
                //adhoc construction of data grid friendly objects
                if(applyFilter && entity.state === 'unavailable')
                    continue;

                fetchedRules.push(
                    {
                        id: entity.entity_id,
                        name: entity.attributes.friendly_name,
                        state: entity.state,
                        internal_id: entity.attributes.id
                    }
                );
            }
            setLoading(()=>false);
            setRules(fetchedRules);
        }).catch((error)=>{
            console.error(error);
        })
    },[applyFilter]);

    return <>
       <Box>
           <Typography>Select Rules</Typography>
           <StyledDataGrid
                checkboxSelection
                rows={rules}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                onRowSelectionModelChange={
                //placeholder for future implementation
                    (ids) => {
                        // console.log(...ids);
                        //retrieve a minimal data model from this component
                        // filter those entries in rules that have the same ids
                        const entries = rules.filter((rule) => {
                            return (ids.findIndex((id) => id === rule.id) !== -1)
                        });
                        const minimal = entries.map((entry)=>{
                            //the entity_id is used for rest calls to /api/stores/<entity_id>
                            // while the internal_id is used for calls to /api/config/automation/config/<internal_id>
                            // where the last call yields more information about which rule is compatible with
                            // another rule. Compatible means for now 'x uses the same triggers as y'
                            return { 'entity_id': entry.id, 'internal_id': entry.internal_id };
                        });
                        // propagate to store
                        useRulesStore.getState().setSelectedRules(minimal);
                    }
                }
                sx={
                    {
                        m: 2,
                        height: '75vh',
                        maxWidth: 700
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
                        tooltip: `Discard rules from the table that have the 'Current State' entry set to: unavailable`,
                    }
                }}
           />


       </Box>
    </>
}
import useEntityConfigurationStore from "../stores/EntityConfigurationStore.jsx";
import {useEffect, useState} from "react";
import JsonView from "react18-json-view";
import 'react18-json-view/src/style.css'
import axios from "axios";
import {Box, Button, Grid2, IconButton, Skeleton, Stack, styled, Tooltip, Typography} from "@mui/material";
import HistoryIcon from '@mui/icons-material/History';
import './EntityConfigurationEditor.css';
import LightControl from "../controls/LightControl.jsx";

//no whitespace between & and :: is intended here
const StyledBox = styled(Box)(({ theme }) => ({
    "&::-webkit-scrollbar": {
        width: "16px"
    },
    "&::-webkit-scrollbar-track": {
        backgroundColor: "rgb(255 255 255 / 10%)",
    },
    "&::-webkit-scrollbar-thumb": {
        borderRadius: "16px",
        backgroundColor: "grey",
        backgroundImage: "linear-gradient(45deg, #a68eff, #90caf9)"
    }
}));

export default function EntityConfigurationEditor(
    {
        entity,
        selectedEntitiesMap = new Map(),
        setSelectedEntitiesMap = (map) => {},
        editedEntitiesMap = new Map(),
        setEditedEntitiesMap = (map) => {},
    }
) {
    //updates the internal data structure as soon as a change has been detected
    const onChangeHandler = (event) => {
        //update map
        const configurations = new Map(editedEntitiesMap)
        configurations.set(event.src.entity_id, event.src)
        setEditedEntitiesMap(configurations);
        // select automatically if the checkbox is not set
        setEdited(()=>true);
    }

    const resetConfigurationHandler = (event) => {
        const defaultConfigurations = selectedEntitiesMap;
        const editedConfigurations = new Map(editedEntitiesMap);
        // remove edited configurations
        const { entityId } = useEntityConfigurationStore.getState().entityToEdit;
        editedConfigurations.delete(entityId);
        setEditedEntitiesMap(editedConfigurations);

        const config = defaultConfigurations.get(entityId);

        setEdited(()=>false);
        setJsonData(config);
    }

    // The json editor component handles changes to the data internally.
    // We therefore don't need to reflect the changes into the state.
    const [jsonData, setJsonData] = useState({});
    const [domain, setDomain] = useState(null);
    // hide/show edit commands
    const [edited, setEdited] = useState(false);

    useEffect(() => {
        if (entity === null)
            return

        const domain = entity?.entityId.split('.')[0]
        setDomain(()=>domain);
        // check if there is already an entry for this entity in the maps
        const isInEdited = editedEntitiesMap.has(entity.entityId);
        if (isInEdited){
            const config = editedEntitiesMap.get(entity.entityId);
            setJsonData(()=>config);
            console.log(config);
            // setDomain(()=>domain);
            setEdited(()=>true);
            return;
        }
        const isInSelected = selectedEntitiesMap.has(entity.entityId);
        if (isInSelected){
            const config = selectedEntitiesMap.get(entity.entityId);
            setJsonData(()=>config);
            console.log(config);
            // setDomain(()=>domain);
            setEdited(()=>false);
            return;
        }

    }, [entity]);

    return <>
        <StyledBox sx={{m:2, overflow: 'auto', maxHeight: '80%', width:400}}>
            <Typography> Edit Entity Configuration</Typography>
            <Grid2 container spacing={2} sx={{margin: 1}}>
            </Grid2>
            {
                (domain === "light") && (
                <LightControl
                    entityId={entity.entityId}
                    onChangeHandler={onChangeHandler}
                    initialValues={jsonData}
                />)
            }
            {
                (!["light"].includes(domain)) && (
                    <JsonView
                        src={jsonData}
                        // theme={"default"}
                        classes={"json-view"}
                        collapsed={2}
                        editable
                        dark
                        onChange={onChangeHandler}
                    />
                )
            }
        </StyledBox>
    </>
}
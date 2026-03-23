import {forwardRef, useEffect, useState} from "react";
import {
    TreeItem2,
    TreeItem2Content, TreeItem2GroupTransition,
    TreeItem2Icon,
    TreeItem2IconContainer, TreeItem2Label,
    TreeItem2Provider,
    TreeItem2Root, useTreeItem2Utils
} from "@mui/x-tree-view";
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdjustIcon from '@mui/icons-material/Adjust';
import { useTreeItem2 } from '@mui/x-tree-view/useTreeItem2';
import {Checkbox, IconButton, Stack, Tooltip} from "@mui/material";
import useEntityConfigurationStore from "../stores/EntityConfigurationStore.jsx";
import {CheckBox} from "@mui/icons-material";
import {runInContext as editedEntitiesMap} from "lodash";

const EditedConfigurationTreeItem = forwardRef(function CustomTreeItem(
    // {
    //     id,
    //     itemId,
    //     label,
    //     checked,
    //     children,
    //     randomNumber
    // },
    props,
    ref
) {

    const {id, itemId, label, children, onChecked, selectedEntitiesMap, editedEntitiesMap } = props;

    const {
        getRootProps,
        getContentProps,
        getLabelProps,
        getGroupTransitionProps,
        getIconContainerProps,
        getLabelInputProps,
        status
        // } = useTreeItem2({ id, itemId, label, children, rootRef: ref });
    }= useTreeItem2(props);


    const [ configurationEdited, setConfigurationEdited ] = useState(((editedEntitiesMap.get(itemId) !== undefined)) );
    const [ configurationSelected, setConfigurationSelected ] = useState(((selectedEntitiesMap.get(itemId) !== undefined)));
    //this construct should prevent unintended updates due to scrolling activity
    const [ triggerUpdate, setTriggerUpdate ] = useState(null);

    useEffect(()=>{
        if(triggerUpdate) {
            onChecked(label, configurationSelected);
            setTriggerUpdate(null);
        }

    },[triggerUpdate]);

    return (
        <TreeItem2Provider itemId={itemId}>
            <TreeItem2Root {...getRootProps()}>
                <TreeItem2Content
                    {...getContentProps()}
                >
                    <TreeItem2IconContainer {...getIconContainerProps()}>
                        <TreeItem2Icon status={status}/>
                    </TreeItem2IconContainer>
                    {(children === null) ? (
                    <Stack
                        direction="row"
                        // onHover={()=>{
                        //     console.log('Listitem hovered!');
                        // }}
                    >
                        {
                            <Tooltip title={(configurationSelected) ? "This entity is part of the Configuration": "This entity is not part of the Configuration" } sx={{m:0, p:0}}>
                                <Checkbox size="small" checked={configurationSelected}
                                          onClick={
                                                (event)=>{
                                                    event.defaultMuiPrevented = true;
                                                    setConfigurationSelected(()=>!configurationSelected);
                                                    setTriggerUpdate(()=>true);
                                                }
                                            }
                                />
                            </Tooltip>

                        }

                        {/*{ (configurationSelected) ? (*/}
                        {/*    <Tooltip title={"The entity configuration has been selected and will be uploaded to the smart home backend."}>*/}
                        {/*        <CheckCircleIcon color="primary" size="small" />*/}
                        {/*    </Tooltip>*/}
                        {/*) : <></>}*/}
                        { (configurationEdited) ?  (
                            <Tooltip title={"The entity configuration has been edited."}>
                                <ModeEditOutlineIcon color="primary" size="small" />
                            </Tooltip>
                        ) : <></>}
                    </Stack>
                    ) : <></>}
                    {/*<Tooltip title={"Click on the label to load the current configuration for this entity into the 'Entity Configurations' editor."}>*/}
                        <TreeItem2Label {...getLabelProps()}/>
                    {/*</Tooltip>*/}

                </TreeItem2Content>
                {/*The children*/}
                { children && <TreeItem2GroupTransition {...getGroupTransitionProps()} />}
            </TreeItem2Root>

        </TreeItem2Provider>
    )
});

export default EditedConfigurationTreeItem
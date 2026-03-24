import {forwardRef, useEffect, useState} from "react";
import {
    TreeItem2Content, TreeItem2GroupTransition,
    TreeItem2Icon,
    TreeItem2IconContainer, TreeItem2Label,
    TreeItem2Provider,
    TreeItem2Root, useTreeItem2Utils
} from "@mui/x-tree-view";
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
import { useTreeItem2 } from '@mui/x-tree-view/useTreeItem2';
import {Checkbox, IconButton, Stack, Tooltip} from "@mui/material";

const EditedConfigurationTreeItem = forwardRef(function CustomTreeItem(
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
        status
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
                        { (configurationEdited) ?  (
                            <Tooltip title={"The entity configuration has been edited."}>
                                <ModeEditOutlineIcon color="primary" size="small" />
                            </Tooltip>
                        ) : <></>}
                    </Stack>
                    ) : <></>}
                        <TreeItem2Label {...getLabelProps()}/>
                </TreeItem2Content>

                { children && <TreeItem2GroupTransition {...getGroupTransitionProps()} />}
            </TreeItem2Root>

        </TreeItem2Provider>
    )
});

export default EditedConfigurationTreeItem
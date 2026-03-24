import {
    Checkbox,
    Chip,
    Grid2,
    IconButton,
    ListItem,
    ListItemText,
    TextField,
    Tooltip,
} from "@mui/material";
import React, {Fragment, useState} from "react";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import {CheckCircleOutlineOutlined, CircleOutlined} from "@mui/icons-material";

export default function MemoItem(
{
    checked = false,
    setChecked = (next) => {},
    item = { desc: "New Memo/TODO", createdAt: "123" },
    onDeleteClick = (item) => {},
    onUpdate=(next)=>{}
}) {

    const [editEnabled, setEditEnabled] = useState(false);
    const [updatedDescription, setUpdateDescription] = useState(item.desc);

    return  <ListItem alignItems={"flex-start"}>

        <ListItemText
            sx={{m:1}}
            primary={
                (
                    <Grid2 container>
                        <Grid2 size={11}>
                            {(!editEnabled) ? item.desc : (
                                <TextField
                                    required
                                    label={"Description"}
                                    variant="standard"
                                    multiline={true}
                                    margin={"normal"}
                                    defaultValue={item.desc}
                                    sx={{width: "95%"}}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true
                                        }
                                    }}
                                    onChange={(event) => {
                                        setUpdateDescription(event.target.value)
                                    }}
                                />
                            )}
                        </Grid2>
                        <Grid2 size={1}>
                            <Checkbox
                                checked={checked}
                                onClick={
                                    ()=>{
                                        setChecked(!checked);
                                    }
                                }
                            />
                        </Grid2>
                    </Grid2>
                )
            }
            secondary={
                <Fragment>
                    <Grid2 container>
                        <Grid2 size={6}>
                            {
                                (!editEnabled) ? (
                                    <Tooltip title={"Edit this Memo"}>
                                        <IconButton edge={"start"} color="primary" onClick={()=>setEditEnabled(!editEnabled)}>
                                            <ModeEditOutlineIcon/>
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title={"Commit Changes"}>
                                        <IconButton edge={"start"} color="primary" onClick={
                                            ()=>{
                                                setEditEnabled(()=>!editEnabled);
                                                item.desc = updatedDescription;
                                                //Triggers update?
                                                onUpdate(item);
                                            }
                                        }
                                        >
                                            <CheckCircleOutlineOutlined color="primary" />
                                        </IconButton>
                                    </Tooltip>
                                )
                            }

                            <Tooltip title={"Delete this Memo"}>
                                <IconButton edge={"start"} color="primary" onClick={()=>onDeleteClick(item)}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Tooltip>
                        </Grid2>

                        <Grid2 size={6}>
                            <Chip variant="outlined" size="small" label={`created: ${item.createdAt}`} color="primary" sx={{mt:1.25, ml:4}}/>
                        </Grid2>

                    </Grid2>
                </Fragment>
            }
        />
    </ListItem>
}
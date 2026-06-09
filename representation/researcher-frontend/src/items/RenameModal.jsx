import {Box, Button, Divider, FormControl, Modal, Stack, TextField, Tooltip, Typography} from "@mui/material";
import modalStyles from "./ModalStyles.jsx";
import {useState} from "react";
import ModalHeader from "../base/ModalHeader.jsx";

export default function RenameModal(
    {
        active=false,
        onClose=()=>{},
        configurationName="some configuration name",
        onCommitClick=(name) => {  }
    }
){

    const [ renamed, setRenamed ] = useState(configurationName);

    return (
        <Modal
            open={active}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={modalStyles} className={"modal-box"}>
                <ModalHeader>
                    Rename Configuration
                </ModalHeader>
                <Divider/>
                <Box sx={{m:1}}>
                    <FormControl>
                        <TextField
                            id={"label-new-config-name"}
                            required
                            label={"Rename Configuration To"}
                            variant="filled"
                            margin={"normal"}
                            defaultValue={configurationName}
                            sx={{width: "400px"}}
                            slotProps={{
                                inputLabel: {
                                    shrink: true
                                }
                            }}
                            onChange={ (event) => {setRenamed(event.target.value)}}
                        />
                        <Stack spacing={2} direction="row">
                            <Tooltip title={"Confirm the changed configuration name."}>
                                <Button
                                    edge={"start"}
                                    sx={{ m:1 }}
                                    variant={"outlined"}
                                    onClick={ () => {
                                        onCommitClick(() => renamed);
                                        onClose()
                                    } }
                                >
                                    Commit
                                </Button>
                            </Tooltip>
                            <Tooltip title={"Abort the operation."}>
                                <Button
                                    edge={"end"}
                                    sx={{ m:1 }}
                                    variant="contained"
                                    color="error"
                                    onClick={onClose}
                                >
                                    Abort
                                </Button>
                            </Tooltip>
                        </Stack>
                    </FormControl>
                </Box>
            </Box>
        </Modal>
    )
}
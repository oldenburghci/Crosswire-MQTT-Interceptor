import {
    Box,
    Button,
    Divider,
    FormControl,
    Grid2,
    InputLabel,
    Modal,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import modalStyles from "./ModalStyles.jsx";
import {useEffect, useState} from "react";
import useCredentialStore from "../stores/CredentialStore.jsx";
import axios from "axios";
import useApplicationStore from "../stores/ApplicationStore.jsx";
import ModalHeader from "../base/ModalHeader.jsx";

const defaultExperimentNames=[
    'Lights Out',
    'Bed Light Disco',
    'Roller Shutter Dance',
    'Broken Heater Controls',
    'The Twin Peaks "Red Room" Music Playlist',
    'Lorem Ipsum Experiment'
]

export default function NewConfigurationModal(
    {
        open=false,
        onClose=()=>{}
    }
) {

    const [token, setToken] = useState(useCredentialStore.getState().token);
    const [configurationName, setConfigurationName] = useState(defaultExperimentNames[Math.floor(Math.random() * defaultExperimentNames.length)]);

    const reloadConfigurations = useApplicationStore.getState().triggerReloadConfigurations;

    useEffect(()=>{
        useCredentialStore.subscribe(
            (state) => state.token,
            (token) => {
                setToken(token);
            }
        )
    },[]);

    const createConfigurationHandler = () => {
        axios.post(
            "/middleware/api/configurations",
            {
                friendlyName: configurationName,
            },
            {
                headers:{
                    "Authorization": `Bearer ${token}`,
                }
            }
        ).then((response) => {
            const { resourceID } = response.data;
            //this is the configuration's ID...
            // let's create a memo in the same go
            console.log(resourceID);
            axios.post(
                "/middleware/api/memos",
                {
                    referencedBy: [
                        {
                            resourceKey: resourceID,
                        },
                    ],
                    items: [
                        {
                            checked: true,
                            desc: "The configuration has been initialized."
                        }
                    ],
                    shared: false
                },
                {
                    headers:{
                        "Authorization": `Bearer ${token}`,
                    }
                }
            ).then((memoResponse) => {
                const { data } = memoResponse;
                console.log(`memos... ${data}`)
            }).catch((error) => {
                console.error(error);
            });
            reloadConfigurations();
        }).catch((error) => {
        })
        onClose();
    }


    return (
        <Modal
           open={open}
           onClose={onClose}
        >
            <Box sx={modalStyles} className={"modal-box"}>
                <ModalHeader>
                    Create Configuration
                </ModalHeader>
                <Divider/>
                <Box sx={{m:1}}>
                    <FormControl>
                        <TextField
                            id={"label-new-config-name"}
                            required
                            label={"Configuration Name"}
                            variant="filled"
                            margin={"normal"}
                            defaultValue={configurationName}
                            sx={{width: "400px"}}
                            slotProps={{
                                inputLabel: {
                                    shrink: true
                                }
                            }}
                            onChange={ (event) => {setConfigurationName(event.target.value)}}
                        />
                    </FormControl>
                    <Grid2 container sx={{m:2, mb:1}}>
                        <Grid2 size={6}/>
                        <Grid2 size={6}>
                            <Tooltip title={"Confirm the new configuration name."}>
                                <Button
                                    edge={"start"}
                                    sx={{mr:1, ml:1}}
                                    variant="outlined"
                                    onClick={createConfigurationHandler}
                                >
                                    Create
                                </Button>
                            </Tooltip>
                            <Tooltip title={"Abort action."}>
                                <Button
                                    color="error"
                                    edge={"end"}
                                    sx={{mr:1, ml:1}}
                                    variant="contained"
                                    onClick={onClose}
                                >
                                    Abort
                                </Button>
                            </Tooltip>
                        </Grid2>
                    </Grid2>
                </Box>
            </Box>
        </Modal>
    )
}
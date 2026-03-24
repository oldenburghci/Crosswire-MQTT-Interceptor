import { Button, FormControl, Paper, Stack, TextField, Tooltip, Typography} from "@mui/material";
import "./ScrollbarStyles.css";
import {useEffect, useState} from "react";

export default function DeleteConfiguration({
    friendlyName="Lorem Ipsum",
    commitDelete=()=>{}
}) {

    const [ typed, setTyped ] = useState("");
    const [ deletionUnconfirmed, setDeletionUnconfirmed ] = useState(true);

    useEffect(() => {
        setDeletionUnconfirmed(typed !== friendlyName);
    }, [typed, friendlyName]);

    return <>
        <Paper
            elevation={6}
            sx={{width:1000, height:  500, borderRadius: 4}}
            className={"danger-box"}
        >
            <Stack>
                <Stack
                    sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 4,
                        alignItems: "center",
                        justifyContent: "center",

                }}
                    className={"danger-box"}
                >
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            color: "#112A46",
                        }}
                    >
                        Danger Zone
                    </Typography>
                </Stack>

                <Stack spacing={2} direction="row" sx={{justifyContent: "center", alignItems: "center", }}>
                    <FormControl>
                        <TextField
                            id={"label-new-config-name"}
                            required
                            label={`Type "${friendlyName}" to confirm deletion`}
                            variant="filled"
                            margin={"normal"}
                            sx={{minWidth: 500}}
                            slotProps={{
                                inputLabel: {
                                    shrink: true
                                }
                            }}
                            onChange={ (event) => {setTyped(event.target.value)}}
                        />
                        <Tooltip title={"Confirm the deletion."}>
                            <Button
                                edge={"start"}
                                sx={{ m:1 }}
                                variant={"outlined"}
                                onClick={ () => {
                                    commitDelete();
                                } }
                                disabled={deletionUnconfirmed}
                            >
                                Commit
                            </Button>
                        </Tooltip>
                    </FormControl>
                </Stack>
            </Stack>
        </Paper>
    </>
}


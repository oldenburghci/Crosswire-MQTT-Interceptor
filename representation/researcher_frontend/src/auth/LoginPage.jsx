import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Grid2,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import {useCallback, useRef, useState} from "react";
import axios from "axios";
import useCredentialStore from "../stores/CredentialStore.jsx";


const css = {
    '--login-bg': '#399cdf',
    '--login-color': '#90caf9',
    '--login-bg-from': '#90caf9',
    '--login-bg-to': '#5d3cd8',
};

export default function LoginComponent(props={
    // login: false,
    setLogin: () => {}
}) {

    const [ password, setPassword ] = useState("operator1");
    const [ username, setUsername ] = useState("operator1");
    //Feedback for failure
    const [ incorrectPassword, setIncorrectPassword ] = useState(null);
    const [ incorrectCombination, setIncorrectCombination ] = useState(null);

    const setToken = useCredentialStore.getState().setToken;
    const onSubmitClicked = () => {

        axios(
            '/login',
            {
                method: 'POST',
                data: {
                    username: username,
                    password: password,
                }
            }
        ).then(
            ({data}) => {
                const { token } = data;
                setToken(token);
                props.setLogin(true);
                setUsername("");
                setPassword("");
            }
        ).catch((error)=>{
            const { message } = error.response.data;
            (message === "wrong password") && setIncorrectPassword(true);
            (message === "no such user") && setIncorrectCombination(true)
            //failed
            props.setLogin(false);
        })
    }

    return (
        <Box style={{padding: 100, margin: 100}}>
            <Paper style={{padding: 20, borderRadius: 10}} className="modal-box">
                <Grid2
                    container
                    spacing={3}
                    direction={'column'}
                    justify={'center'}
                    alignItems={'center'}
                >
                    <Grid2 item xs={12}>
                        <Typography variant={"h4"}> Login </Typography>
                    </Grid2>
                    <Grid2 item xs={12}>
                        {
                            (incorrectCombination) ? (
                                <TextField
                                    label="Email"
                                    type="text"
                                    variant="outlined"
                                    error
                                    helperText={"No user by this email or username"}
                                    onChange={(event) => setUsername(event.target.value) }
                                    onFocus={()=> setIncorrectCombination(false)}
                                    tabIndex={0}
                                />
                            ) : (
                                <TextField
                                    label="Email/Username"
                                    type="text"
                                    onChange={(event) => setUsername(event.target.value)}
                                    tabIndex={0}
                                />
                            )
                        }
                    </Grid2>

                    <Grid2 item xs={12}>
                        {
                            (incorrectPassword) ? (
                                <TextField
                                    label="Password"
                                    type="password"
                                    variant="outlined"
                                    error
                                    helperText={"Incorrect Password"}
                                    defaultValue={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    onFocus={() => setIncorrectPassword(false)}
                                    tabIndex={1}
                                />
                            ) : (
                                <TextField
                                    label="Password"
                                    type="password"
                                    defaultValue={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    tabIndex={1}
                                />
                            )}
                    </Grid2>
                    <Grid2 item xs={12}>
                        {/*<FormControlLabel*/}
                        {/*    control={*/}
                        {/*        <Checkbox*/}
                        {/*            checked={false}*/}
                        {/*            onChange={()=>{}}*/}
                        {/*            label={'Keep me logged in'}*/}
                        {/*            inputProps={{ 'aria-label': 'primary checkbox' }}*/}
                        {/*            tabIndex={4}*/}
                        {/*        />*/}
                        {/*    }*/}
                        {/*    label="Keep me logged in"*/}
                        {/*    tabIndex={-1}*/}
                        {/*/>*/}
                    </Grid2>
                    <Grid2 item xs={12}>
                        <Button
                            fullWidth
                            variant={"contained"}
                            onClick={ onSubmitClicked }
                            tabIndex={2}
                        > Login </Button>
                    </Grid2>
                </Grid2>
            </Paper>
        </Box>
    )



}

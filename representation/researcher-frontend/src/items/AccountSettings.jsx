import {useEffect, useState} from "react";
import useCredentialStore from "../stores/CredentialStore.jsx";
import modalStyles from "./ModalStyles.jsx";
import {
    Box,
    Button,
    Divider,
    FormControl, FormControlLabel,
    FormLabel, Grid2,
    InputLabel,
    Modal, Stack,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import axios from "axios";
import ModalHeader from "../base/ModalHeader.jsx";
import ReactConfetti from "react-confetti";


export default function AccountSettings(
    {
        open=false,
        setOpen=(next)=>{},
        user= {
            email: "",
            username: ""
        },
        setUser=(next)=>{},
        initialUser={
            email: "",
            username: ""
        }
    }
) {
    // --- States ---
    const [token] = useState(useCredentialStore.getState().token)
    const [usernameChanged, setUsernameChanged] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("something hidden");
    const [newPassword, setNewPassword] = useState("s0mething hidden");
    const [confirmPassword, setConfirmPassword] = useState("$omething hidden");
    const [emailChanged, setEmailChanged] = useState(false);
    // feedback on server response
    const [passwordErrorText, setPasswordErrorText] = useState(null);
    const [openSuccessModal, setOpenSuccessModal] = useState(false);
    const [countDown, setCountDown] = useState(5);
    const [successMessage, setSuccessMessage] = useState("");
    const [validatePassword, setValidatePassword] = useState(false);
    const [confirmPasswordHelperText, setConfirmPasswordHelperText] = useState(null);

    // --- Handler ---
    const onClose = () => {
        setOpen(false);
    }

    const forceLogout = (message) =>{
        setSuccessMessage(()=>message);
        setOpenSuccessModal(()=>true);
        const descriptor = setInterval(()=>{
            (countDown > 0) && setCountDown((countDown)=>countDown-1);
        }, 1000);
        setTimeout(()=>{
            setOpenSuccessModal(false);
            const setToken = useCredentialStore.getState().setToken;
            //TODO: send message to invalidate session
            setToken(null);
            clearInterval(descriptor);
            setCountDown(5);
        }, 5300);
    }

    const onSubmit=()=>{
        console.log({usernameChanged, passwordChanged, emailChanged});
        if (!usernameChanged && !passwordChanged && !emailChanged)
            return;
        if(passwordChanged && validatePassword){
            axios.put(
                "/auth/password",
                {
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                },
                {
                    headers:{
                        Authorization: `Bearer ${token}`,
                    }
                }
            ).then((response) => {
                // const { status } = response.data;
                // console.log(status, response.status);
                forceLogout("Password successfully changed.");
            }).catch((error) => {
                if (error.response.status === 401) {
                    const { message } = error.response.data;
                    setPasswordErrorText(()=>message);
                    // setValidatePassword(()=>false);
                }
                if (error.response.status === 400) {
                    const { message } = error.response.data;
                    setConfirmPasswordHelperText(message);
                    setValidatePassword(()=>false);
                }
            })
        }
        if(usernameChanged || emailChanged){
            axios.put(
            "/auth/user",
            {
                    username: user.username,
                    email: user.email,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            ).then((response) => {
                //show the success message
                // const { message } = response.data;
               forceLogout("User information successfully changed.");
            }).catch((error) => {
                if (error.response.status === 401) {
                    const { message } = error.response.data;
                    setPasswordErrorText(()=>message);
                }
            })
        }

    }
    // --- Effects ---
    useEffect(()=>{
        if (!passwordChanged) {
            setValidatePassword(() => null)
            return;
        }
        setValidatePassword(
            ()=>(
                passwordChanged &&
                newPassword === confirmPassword &&
                newPassword.length === confirmPassword.length &&
                8 <= newPassword.length <= 48 &&
                8 <= confirmPassword.length <= 48
            )
        );
        (!validatePassword) &&  setConfirmPasswordHelperText("The passwords must be equal and between 8 and 48 characters long.");
        // console.log(passwordChanged )
        // console.log(newPassword !== confirmPassword )
        // console.log(newPassword.length !== confirmPassword.length )
        // console.log(8 <= newPassword.length <= 48 )
        // console.log(8 <= confirmPassword.length <= 48)
    }, [passwordChanged, currentPassword, newPassword, confirmPassword]);

    // useEffect(()=>{
    //     if (validatePassword) return;
    //     setConfirmPasswordHelperText("The passwords must be equal and between 8 and 48 characters long.")
    // }, [validatePassword]);


    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box sx={modalStyles} className={"modal-box"}>
                <ModalHeader>
                    Settings
                </ModalHeader>
                <Divider sx={{mt:1, mb:1}}/>
                <Box sx={{m:1}}>
                    {/*Username*/}
                    <FormControl>
                        <FormControlLabel
                            sx={{m:1, pr:3}}
                            control={
                                <TextField
                                    required
                                    variant="filled"
                                    size="small"
                                    sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                    defaultValue={user.username}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true
                                        }
                                    }}
                                    onChange={ (event) => {
                                        setUser({ ...user, username: event.target.value });
                                        setUsernameChanged((initialUser.username !== event.target.value));
                                    }}

                                />
                            }
                            label={"Username"}
                            labelPlacement={"start"}
                        />
                        {/*Email*/}
                        <FormControlLabel
                            sx={{m:1, pr:3}}
                            control={
                                <TextField
                                    required
                                    variant="filled"
                                    size="small"
                                    type="email"
                                    sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                    defaultValue={user.email}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true
                                        }
                                    }}
                                    onChange={ (event) => {
                                        setUser({ ...user, email: event.target.value });
                                        setEmailChanged((initialUser.email !== event.target.value));
                                    }}
                                />
                            }
                            label={"Email"}
                            labelPlacement={"start"}
                        />
                        {/*Current Password*/}
                        <FormControlLabel
                            sx={{m:1, pr:3}}
                            tabIndex={2}
                            control={
                                (passwordErrorText === null) ? (
                                    <TextField
                                        required
                                        variant="filled"
                                        size="small"
                                        sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                        defaultValue={currentPassword}
                                        type = "password"
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            }
                                        }}
                                        onChange={ (event) => {
                                            // setPasswordChanged(true)
                                            setCurrentPassword(event.target.value)
                                        }}
                                    />
                                ) : (
                                    <TextField
                                        required
                                        error
                                        variant="outlined"
                                        size="small"
                                        helperText={passwordErrorText}
                                        sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                        defaultValue={currentPassword}
                                        type = "password"
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            }
                                        }}
                                        onChange={ (event) => {
                                            // setPasswordChanged(true)
                                            setCurrentPassword(event.target.value)
                                            setPasswordErrorText(()=>null);
                                        }}
                                    />
                                )
                            }
                            label={"Current Password"}
                            labelPlacement={"start"}
                        />
                        {/*New Password*/}
                        <FormControlLabel
                            sx={{m:1, pr:3}}
                            tabIndex={3}
                            control={
                                    <TextField
                                        required
                                        variant="filled"
                                        size="small"
                                        sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                        defaultValue={newPassword}
                                        type = "password"
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            }
                                        }}
                                        onBlur={ (event) => {
                                            setPasswordChanged(()=>true)
                                            setNewPassword(()=> event.target.value);
                                            setPasswordErrorText(()=>null);
                                        }}
                                    />
                                // )
                            }
                            label={"New Password"}
                            labelPlacement={"start"}
                        />
                        {/*Confirm Password*/}
                        <FormControlLabel
                            sx={{m:1, pr:3}}
                            control={
                                (validatePassword === false) ? (
                                    <TextField
                                        required
                                        error
                                        variant="outlined"
                                        helperText={confirmPasswordHelperText}
                                        size="small"
                                        sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                        defaultValue={confirmPassword}
                                        type = "password"
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            }
                                        }}
                                        onBlur={ (event) => {
                                            setConfirmPassword(()=>event.target.value);
                                            // setConfirmPasswordHelperText(()=>null);
                                        }}
                                        onChange={()=>{
                                            setConfirmPasswordHelperText(()=>null);
                                        }}
                                    />
                                ): (
                                    <TextField
                                        required
                                        variant="filled"
                                        size="small"
                                        sx={{ maxWidth: 500, minWidth: 350, ml:2}}
                                        defaultValue={confirmPassword}
                                        type = "password"
                                        slotProps={{
                                            inputLabel: {
                                                shrink: true
                                            }
                                        }}
                                        onBlur={ (event) => {
                                            setConfirmPassword(()=>event.target.value);
                                        }}
                                    />
                                )
                            }
                            label={"Confirm new Password"}
                            labelPlacement={"start"}
                        />
                    </FormControl>

                    <Grid2 container sx={{m:2, mb:1}}>
                        <Grid2 size={6}>

                        </Grid2>

                        <Grid2 size={6}>
                            {/*Submit*/}
                            <Tooltip title={"Confirm the changes to your account."}>
                                <Button
                                    disabled={!((passwordChanged && validatePassword) || usernameChanged || emailChanged)}
                                    edge={"start"}
                                    variant="contained"
                                    onClick={ () => {
                                        onSubmit();
                                    } }
                                    sx={{mr:1, ml:1}}
                                >
                                    Submit
                                </Button>
                            </Tooltip>
                            {/*Abort*/}
                            <Tooltip title={"Abort the operation."}>
                                <Button
                                    edge={"end"}
                                    variant="contained"
                                    color="error"
                                    onClick={onClose}
                                    sx={{mr:1, ml:1}}
                                >
                                    Abort
                                </Button>
                            </Tooltip>
                        </Grid2>
                    </Grid2>
                    {/*<ReactConfetti width={400} height={400}/>*/}
                    <Modal open={openSuccessModal}>
                        <Box sx={modalStyles} className={"modal-box"}>
                            <Box sx={{m:1}}>
                                <Typography variant="body1">
                                    {successMessage} You will redirect to the Login in { countDown }.
                                </Typography>
                                <ReactConfetti width={600} height={200} style={{top:120}}/>
                            </Box>
                        </Box>
                    </Modal>
                </Box>
            </Box>
        </Modal>
    )
}
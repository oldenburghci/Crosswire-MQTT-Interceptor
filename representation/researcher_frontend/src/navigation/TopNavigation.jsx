import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container, Divider,
    Grid2, ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Tooltip,
    Typography
} from "@mui/material";
import {useEffect, useState} from "react";
import {Logout, Settings} from "@mui/icons-material";
import AccountSettings from "../items/AccountSettings.jsx";
import axios from "axios";
import useCredentialStore from "../stores/CredentialStore.jsx";



export default function TopNavigation(props) {

    const [token] = useState(useCredentialStore.getState().token);
    const [anchor, setAnchor] = useState(null);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [initialUser, setInitialUser] = useState(null);
    const setToken = useCredentialStore.getState().setToken;


    const onOpenMenu = (event) => {
        setAnchor(event.currentTarget);

    }
    const onCloseMenu = () => {
        setAnchor(null);
    }

    useEffect(() => {
        if (!token) return;

        axios.get(
            `/auth/whoami`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        ).then((response) => {
            const { username, email } = response.data;
            // console.log(user);
            setCurrentUser(()=>{return {username: username, email: email}});
            setInitialUser(()=>{return {username: username, email: email}});
        }).catch((error) => {
            console.error(error);
        })
    }, [token]);

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Box sx={{flexGrow: 2}}>
                        <Typography variant="h6" noWrap component="div">
                            Researcher Frontend
                        </Typography>
                    </Box>

                    <Box sx={{flexGrow: 2}} />

                    <Box sx={{ flexGrow: 0}} edge="end">
                        <Stack direction="row" spacing={2}>
                            <Typography variant="body1" component="div" noWrap  sx={{mr:3, pt: 2}}>Hello, {(currentUser) ? currentUser.username: "?"}!</Typography>
                            <Tooltip title={"Account Setting"}>
                                <Button onClick={onOpenMenu} >
                                    <Avatar/>
                                </Button>
                            </Tooltip>
                        </Stack>
                        <Menu
                            sx={{ mt: 6}}
                            anchorEl={anchor}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchor)}
                            onClose={onCloseMenu}
                        >

                            <MenuItem
                                onClick={()=>{
                                    // useCredentialStore.setState()
                                    // do remote request to invalid the token
                                    setToken(null);
                                }}
                            >
                                <ListItemIcon>
                                    <Logout fontSize="small"/>
                                </ListItemIcon>
                                Logout
                            </MenuItem>

                            <Divider />

                            <MenuItem
                                onClick={
                                    ()=> {
                                        setSettingsModalOpen(true)
                                    }
                                }
                            >
                                <ListItemIcon>
                                    <Settings fontSize="small"/>
                                </ListItemIcon>
                                Settings
                            </MenuItem>

                            {
                                (currentUser && initialUser) && (
                                    <AccountSettings
                                        open={settingsModalOpen}
                                        setOpen={setSettingsModalOpen}
                                        user={currentUser}
                                        setUser={setCurrentUser}
                                        initialUser={initialUser}
                                    />
                                )
                            }

                        </Menu>
                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    )
}
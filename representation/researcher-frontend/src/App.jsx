import {useEffect, useState} from 'react'
import './App.css'
import {
    Box, CircularProgress,
    createTheme,
    CssBaseline,
    ThemeProvider,
    Toolbar
} from "@mui/material";
import TopNavigation from "./navigation/TopNavigation.jsx";
import ConfigurationDrawer from "./navigation/ConfigurationDrawer.jsx";
import Configuration from "./items/Configuration.jsx";
import axios from "axios";
import LoginComponent from "./auth/LoginPage.jsx";
import useCredentialStore from "./stores/CredentialStore.jsx";
import useApplicationStore from "./stores/ApplicationStore.jsx";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

function App() {

    const drawerWidth = 300;
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(useCredentialStore.getState().token);
    const [reload, setReload] = useState(false);
    const [activeConfiguration, setActiveConfiguration] = useState(0);
    const [activeMenuItem, setActiveMenuItem] = useState(useApplicationStore.getState().lastMenu);

    const [login, setLogin] = useState(false);

    const [configurations, setConfigurations] = useState(null);
    // handler for the navigation in the drawer between configuration item
    const handleConfigurationDrawerItemClicked = (index) => {
        console.log('drawer item clicked')
        setActiveConfiguration(index);
        useApplicationStore.getState().setLastConfiguration(configurations[index].key);
    };
    // handler for the nested menu that all drawer items have attached to them
    const handleConfigurationDrawerMenuItemClicked = (index) => {
        setActiveMenuItem(index);
        useApplicationStore.getState().setLastMenu(index);
    };

    useEffect(()=>{
        const unsubscribeToken =  useCredentialStore.subscribe(
            (state) => state.token,
            (token) => {
                console.log(`token has changed ${token}`)
                setToken(token);
                if (!token)
                    setLogin(false);
            }
        );
        const unsubscribeReload = useApplicationStore.subscribe(
            (state) => state.reloadConfigurations,
            (reloadConfigurations) => {
                console.log('reload configurations...');
                setReload(()=>!reload);
            }
        )

        return () => {
            unsubscribeReload();
            unsubscribeToken();
        }
    },[reload, token]);

    useEffect(() => {
        if (token === "")
            return;

        setLoading(()=>true)
        axios.get(
            '/middleware/api/configurations',
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            }
        ).then((response) => {
            const { data } = response;
            console.log(data);
            setConfigurations(()=>data.configs);
            const lastConfiguration = useApplicationStore.getState().lastConfiguration;
            const index = data.configs.findIndex((item) =>  item.key === lastConfiguration);
            console.log(`last active configuration index after reload=${index}`)
            if (index !== -1) setActiveConfiguration(index);
            setLoading(()=>false)
        }).catch((error) => {
            console.error(error);
        });

        return () => {}
    }, [token]);

    return (
        <>
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            {(!login) ?
                <>

                    <LoginComponent
                        setLogin={ (state) => {
                            setLogin(state);
                        }}
                    />
                </>
                :
                (
                <>
                    <TopNavigation/>
                    <Box sx={{}}>
                        <TopNavigation/>
                        {
                            <ConfigurationDrawer
                                loading={loading}
                                configurations={configurations}
                                drawerWidth={drawerWidth}
                                activeConfiguration={activeConfiguration}
                                handleConfigurationDrawerItemClicked={handleConfigurationDrawerItemClicked}
                                handleConfigurationDrawerMenuItemClicked={handleConfigurationDrawerMenuItemClicked}
                            />
                        }

                        <Box component="main" sx={{p: 3, width: 'auto'}}>
                            <Toolbar/>
                            { loading && <CircularProgress color="primary" size={20} /> }

                            { ( configurations != null && configurations.length > 0) &&
                                <Configuration
                                    configurations={configurations}
                                    setConfigurations={setConfigurations}
                                    activeConfiguration={activeConfiguration}
                                    activeMenuIndex={activeMenuItem}
                                    setActiveMenuIndex={(index)=> handleConfigurationDrawerMenuItemClicked(index)}
                                />
                            }
                        </Box>
                    </Box>
                </>
                )}
            </ThemeProvider>
        </>
    )
}

export default App

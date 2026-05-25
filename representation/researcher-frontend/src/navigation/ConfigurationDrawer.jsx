import {
    Box, CircularProgress, Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Tooltip, Typography
} from "@mui/material";
import ControlPointRoundedIcon from '@mui/icons-material/ControlPointRounded';
import {useState} from "react";
import ConfigurationDrawerItem from "../items/ConfigurationDrawerItem.jsx";
import NewConfigurationModal from "../items/NewConfigurationModal.jsx";


export default function ConfigurationDrawer(
    {
        loading=false,
        configurations = [
            {friendlyName: 'Config1', key: 0},
            {friendlyName: 'Config2', key: 1},
            {friendlyName: 'Config3', key: 2}
        ],
        activeConfiguration = 0,
        drawerWidth = 240,
        //forward to individual item
        handleConfigurationDrawerItemClicked = (index) => {},
        handleConfigurationDrawerMenuItemClicked = (index) => {}
    }
) {

    const [newConfigModalOpen, setNewConfigModalOpen] = useState(false);
    const onCloseNewConfigModal = () => {
        setNewConfigModalOpen(()=>false);
        //go into edit mode
        handleConfigurationDrawerMenuItemClicked(0);
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
                <List>
                    <ListItem>
                        <ListItemText><Typography variant="h6">Your Configurations:</Typography></ListItemText>
                    </ListItem>
                    <Divider sx={{ pl: 1}}/>
                    { (loading) ? <CircularProgress/> : configurations.map((config, index) => (
                        <ConfigurationDrawerItem
                            itemKey={config.key}
                            label={config.friendlyName}
                            isSelected={(activeConfiguration === index)}
                            handleConfigurationDrawerItemClicked={handleConfigurationDrawerItemClicked}
                            handleConfigurationDrawerMenuItemClicked={handleConfigurationDrawerMenuItemClicked}
                            index={index}
                        />
                    ))}
                    <Divider sx={{ p: 1 }}/>
                    {/*Last Item */}
                    <ListItem key={"addConfig"} disablePadding>
                        <Tooltip title={"Create a new Configuration"}>
                            <ListItemButton
                                onClick={()=>{
                                    setNewConfigModalOpen(()=>true);
                                }}
                            >
                                <ListItemIcon>
                                    <ControlPointRoundedIcon color={"primary"} />
                                </ListItemIcon>
                                <ListItemText primary="New Config"/>
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>
                </List>
                <NewConfigurationModal
                    open={newConfigModalOpen}
                    onClose={onCloseNewConfigModal}
                />
            </Box>
        </Drawer>
    )
}
import {
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
    Typography
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import MailIcon from "@mui/icons-material/Mail";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {useState} from "react";

export default function ConfigurationDrawerItem(
    {
        itemKey=Math.floor(Math.random()*1000),
        label='Default Label',
        isSelected=false,
        index=0,
        handleConfigurationDrawerItemClicked=(i) => {},
        handleConfigurationDrawerMenuItemClicked=(i)=>{}
    }
){
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClickListItem = (event) => {
        setAnchorEl(event.currentTarget);
    };

    return (
        <ListItem key={itemKey} disablePadding component={"div"}>
            <ListItemButton
                selected={isSelected}
                onClick={() => handleConfigurationDrawerItemClicked(index)}
            >
                <ListItemIcon>
                    {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText
                    primary={<Typography sx={{ wordBreak: "break-word" }}> {label}</Typography>}
                />
            </ListItemButton>
            {/*More options button*/}
            {/*<Tooltip title={"More Options"}>*/}
            {(isSelected) && (
                <IconButton
                    size="medium"
                    sx={
                        {
                            '&:hover, &:focus': {
                                bgcolor: 'unset',
                            },
                            // vertical divider
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                height: '120%',
                                display: 'block',
                                left: 0,
                                width: '2px',
                                bgcolor: 'divider',
                            }
                        }
                    }
                    onClick={ (event) => {
                        handleClickListItem(event);
                        setOpen(() => !open);

                    }}
                >
                    <ChevronRightIcon/>
                        <Menu
                            open={open}
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}

                            transformOrigin={{
                                vertical: "center",
                                horizontal: -25,
                            }}
                        >
                            {/*{*/}
                            {/*    ['Edit', 'Run', 'Rename', 'Share'].map((item, jndex)=>{*/}
                            {/*        return (*/}
                            {/*        <MenuItem*/}
                            {/*            onClick={() => {*/}
                            {/*                handleConfigurationDrawerMenuItemClicked(jndex);*/}
                            {/*            }}*/}
                            {/*        >*/}
                            {/*            {item}*/}
                            {/*        </MenuItem>*/}
                            {/*        )*/}
                            {/*    })*/}
                            {/*}*/}
                            <MenuItem
                                onClick={
                                    () => {
                                        handleConfigurationDrawerMenuItemClicked(0);
                                    }
                                }
                            >
                                Edit
                            </MenuItem>
                            <MenuItem
                                onClick={() => handleConfigurationDrawerMenuItemClicked(1)}
                            >
                                Run
                            </MenuItem>
                            <MenuItem
                                onClick={() => handleConfigurationDrawerMenuItemClicked(2)}
                            >
                                Rename
                            </MenuItem>
                            <MenuItem
                                onClick={() => handleConfigurationDrawerMenuItemClicked(3)}
                            >
                                Share
                            </MenuItem>
                            <MenuItem
                                onClick={()=> handleConfigurationDrawerMenuItemClicked(4)}
                            >
                                Delete
                            </MenuItem>

                        </Menu>

                </IconButton>)}
            {/*</Tooltip>*/}
        </ListItem>
    )
}
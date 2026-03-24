import {
    Badge,
    Button,
    Grid2,
    IconButton,
    ListItem,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Tooltip,
    Typography
} from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import React, {useState} from "react";
import { Brightness4, CircleRounded, Delete, FlashOff, FlashOn} from "@mui/icons-material";
import "./LightListItem.css";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {animated, useSpring} from "@react-spring/web";

const AnimatedListItem = animated(ListItem);

export default function LightListItem (
    props
){
    const {style, index} = props;
    const data = props.data[index];

    const {
        entityId,
        friendlyName, on, setOn,
        activeControlElement, setActiveControlElement,
        brightness, setBrightness, brightnessPct,
        rgbColor, setRGBColor, color,
        transition, setTransition, transitionTime,
        flash, setFlash,
        effectList, selectedEffectIndex,
        setSelectedEffectIndex,
        onDelete,
        isReadOnly
    } = data;

    const [effectMenuOpen, setEffectMenuOpen] = useState(false);
    const [anchorElement, setAnchorElement] = useState(null);

    const handleClickListItem = (event) => {
        setAnchorElement(event.currentTarget);
    };

    const appearProps = useSpring({
        opacity: 1,
        from: {
            opacity: 0,
        }
    });

    return <AnimatedListItem
        style={ {paddingRight: 10, ...style, ...appearProps} }
        component="div"
        // disablePadding
        className={index % 2 === 0 ? "RowEven" : "RowOdd"}
    >
        <Grid2
            container
            size={12}
            sx={{
                justifyContent: "flex-start",
                alignItems: "center",
                // m:1
            }}
            direction="row"
            columnSpacing={0.5}
        >
            <Grid2
                size={3}
            >
                <Typography
                    sx={{pl:2, pr:2}}
                >
                    { friendlyName }
                </Typography>
            </Grid2>
            <Grid2
                size={(!isReadOnly) ? 8 : 9}
            >
                <Paper
                    elevation={8}
                    sx={{borderRadius: 4, minHeight:40, minWidth: 100}}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            justifyContent: "space-evenly",
                        }}
                    >
                        <Grid2
                            container
                            size={12}
                        >
                            <Grid2
                                size={9}

                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        justifyContent: "space-evenly",
                                    }}
                                >
                                <Tooltip title={`Power ${(on) ? "on": "off" }`}>
                                    <IconButton
                                        color={ on ? "primary" : "default"}
                                        onClick={ (!isReadOnly) ? ()=> {
                                            setOn(!on, index, props.data);
                                            setActiveControlElement(-1, -1, props.data);
                                        } : () => {}
                                        }
                                        sx={{
                                            border: on ? "2px solid" : "2px solid transparent",
                                        }}
                                    >
                                        <PowerSettingsNewIcon />
                                    </IconButton>
                                </Tooltip>
                                {/*  Brightness  */}
                                {/* Not provided */}
                                { (brightness === undefined) ? (
                                    <Tooltip title={"This device doesn't support brightness adjustments"}>
                                        <IconButton>
                                            <Brightness4 color="disabled" />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title={ on ? (brightness  ? "Brightness is set"  : "No brightness is set") : "The light must be on before the brightness is adjustable" }>
                                        <Badge
                                            badgeContent={brightnessPct}
                                            invisible={ !(brightness && !(activeControlElement.index === index && activeControlElement.controlElement === 0)) || !on }
                                            color={brightness ? ((activeControlElement.index === index && activeControlElement.controlElement === 0) ? "secondary" : "primary") : "default"}
                                        >
                                            <IconButton
                                                color={brightness ? ((activeControlElement.index === index && activeControlElement.controlElement === 0) ? "secondary" : "primary") : "default"}
                                                onClick={
                                                    (!isReadOnly) ? () => {
                                                        //0 is brightness
                                                        if (brightness) {
                                                            setActiveControlElement(-1, -1, props.data);
                                                            setBrightness(false, index, props.data);
                                                        }else{
                                                            setActiveControlElement(0, index, props.data);
                                                            setBrightness(true, index, props.data);
                                                        }
                                                    } : () => {}
                                                }
                                                sx={{
                                                    border: (brightness && on) ? `2px solid` : '2px solid transparent',
                                                }}
                                                disabled={!on}
                                            >
                                                <Brightness4
                                                    className={(activeControlElement.index === index && activeControlElement.controlElement === 0) ? "breath" : ""}
                                                />
                                            </IconButton>
                                        </Badge >
                                    </Tooltip>
                                )}
                                {/*  Color mode  */}
                                { (rgbColor === undefined) ? (
                                    <Tooltip title={"This device doesn't support light colors"}>
                                        <IconButton>
                                            <ColorLensIcon color="disabled"/>
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title={on ? (rgbColor  ? "Color is set"  : "No color set") : "The light must be on before color is adjustable" }>
                                        <Badge
                                            badgeContent={rgbColor ? <CircleRounded sx={{color: color}} /> : <></>}
                                            invisible={ (!(rgbColor && !(activeControlElement.index === index && activeControlElement.controlElement === 1))) || !on }
                                        >
                                            <IconButton
                                                color={rgbColor ? ((activeControlElement.index === index && activeControlElement.controlElement === 1) ? "secondary" : "primary") : "default"}
                                                onClick={
                                                    (!isReadOnly) ? () => {
                                                        if(rgbColor){
                                                            setActiveControlElement(-1, -1, props.data);
                                                            setRGBColor(false, index, props.data);
                                                        }else{
                                                            setActiveControlElement(1, index, props.data);
                                                            setRGBColor(true, index, props.data);
                                                        }
                                                    } : () => {}
                                                }
                                                sx={{
                                                    border: (rgbColor && on)? `2px solid` : '2px solid transparent',
                                                }}
                                                disabled={!on}
                                            >
                                                <ColorLensIcon
                                                    className={(activeControlElement.index === index && activeControlElement.controlElement === 1) ? "breath" : ""}
                                                />
                                            </IconButton>
                                        </Badge>
                                    </Tooltip>
                                )
                                }
                                {/*  Transition  */}
                                {  <Tooltip title={transition ? "Transition is activated" : "Transition is deactivated" }>
                                    <Badge
                                        badgeContent={transition ? transitionTime : 0}
                                        invisible={ !(transition && !(activeControlElement.index === index && activeControlElement.controlElement === 2)) }
                                        color={transition ? ((activeControlElement.index === index && activeControlElement.controlElement === 2 )? "secondary" : "primary") : "default"}
                                    >
                                        <IconButton
                                            color={(transition) ? ((activeControlElement.index === index && activeControlElement.controlElement === 2) ? "secondary" : "primary") : "default"}
                                            onClick={
                                                (!isReadOnly) ? ()=>{
                                                    if (transition){
                                                        setTransition(false, index, props.data);
                                                        setActiveControlElement(-1, -1, props.data);
                                                    }else{
                                                        setTransition(true, index, props.data);
                                                        setActiveControlElement(2, index, props.data);
                                                    }
                                                } : () => {}
                                            }
                                            sx={{
                                                border: transition ? `2px solid` : '2px solid transparent',
                                            }}
                                        >
                                            <TimelapseIcon
                                                className={(activeControlElement.index === index && activeControlElement.controlElement === 2) ? "breath" : ""}
                                            />
                                        </IconButton>
                                    </Badge>
                                </Tooltip>
                                }
                                {/*Flash*/}
                                {
                                    <Tooltip title={(flash) ? "Flash is active" : "Flash is deactivate"}>
                                        <IconButton
                                            color={(flash) ? 'primary' : 'default'}
                                            onClick={
                                                (!isReadOnly) ? ()=>{
                                                    setFlash(!flash, index, props.data);
                                                    //deactivate all interactive control elements if the user switches
                                                    // from e.g. transition to flash
                                                    setActiveControlElement(-1, -1, props.data);
                                                } : () => {}


                                            }
                                            sx={{
                                                border: flash ? `2px solid` : '2px solid transparent',
                                            }}
                                        >
                                            {(flash) ? <FlashOn color='primary'/> : <FlashOff color='default' />}
                                        </IconButton>
                                    </Tooltip>
                                }
                                </Stack>
                            </Grid2>
                            <Grid2
                                size={3}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        justifyContent: "space-evenly",
                                    }}
                                >
                                {
                                    (effectList === undefined) ?  (
                                        <Tooltip title={"No effects available"}>
                                            {/*<span>*/}
                                            <Button
                                                variant="outlined"
                                                startIcon={<AutoAwesomeIcon/>}
                                                color="disabled"
                                                sx={{
                                                    mt: 2,
                                                    borderRadius: 2,
                                                    boxShadow: 'none',
                                                    p: 1,
                                                    textTransform: 'none',
                                                    border: "2px solid",
                                                }}
                                                disabled
                                            />
                                            {/*</span>*/}
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title={ on ? ((selectedEffectIndex !== -1 || 0) ? `${effectList[selectedEffectIndex]} effect active` : `No effect selected`) : "The light must be on before effects become available."}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AutoAwesomeIcon/>}
                                                color={ (selectedEffectIndex === -1 ) ? "#fff" : "primary"}
                                                sx={{
                                                    borderRadius: 2,
                                                    boxShadow: 'none',
                                                    p: 1,
                                                    textTransform: 'none',
                                                    border: "2px solid",
                                                }}
                                                onClick={
                                                    (!isReadOnly) ? (event) => {
                                                        setEffectMenuOpen(() => !effectMenuOpen);
                                                        handleClickListItem(event)
                                                    } : () => {}
                                                }
                                                disabled={!on}
                                            >
                                                {(!isReadOnly) && (
                                                    <>
                                                        <Typography >
                                                            {(selectedEffectIndex === -1 || setSelectedEffectIndex === undefined) ? 'none' : `${effectList[selectedEffectIndex]}`}
                                                        </Typography>
                                                        <Menu
                                                            open={effectMenuOpen}
                                                            anchorEl={anchorElement}
                                                            anchorOrigin={{
                                                                vertical: "bottom",
                                                                horizontal: "center",
                                                            }}

                                                            transformOrigin={{
                                                                vertical: "center",
                                                                horizontal: -25,
                                                            }}
                                                        >
                                                            {
                                                                (effectList.length > 0) && effectList.map((item, jndex) => {
                                                                    return <MenuItem
                                                                        key={jndex}
                                                                        onClick={
                                                                            (jndex === 0) ? () => {
                                                                                setActiveControlElement(-1, -1, props.data);
                                                                                setSelectedEffectIndex(-1, index, props.data);
                                                                            } : () => {
                                                                                setSelectedEffectIndex(jndex, index, props.data);
                                                                                setActiveControlElement(-1, -1, props.data);
                                                                            }

                                                                        }
                                                                    >
                                                                        {item}
                                                                    </MenuItem>
                                                                })
                                                            }
                                                        </Menu>
                                                    </>
                                                )}
                                            </Button>
                                        </Tooltip>
                                    )
                                }
                                </Stack>
                            </Grid2>
                        </Grid2>

                    </Stack>
                </Paper>
            </Grid2>
            {
                (!isReadOnly)  && (
                    <Grid2
                        size={1}
                    >
                        <Paper
                            elevation={8}
                            sx={{
                                borderRadius: 4,
                            }}
                        >
                            <Stack
                                sx={{justifyContent: "center",}}
                            >
                                <Tooltip title={`Remove '${friendlyName}' from Configuration`}>
                                    <IconButton
                                        color="primary"
                                        onClick={
                                            () => {
                                                // console.log(`remove ${entityId} `)
                                                onDelete(props.data, entityId);
                                            }
                                        }
                                    >
                                        <Delete/>
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Paper>
                    </Grid2>
                )
            }
        </Grid2>
    </AnimatedListItem>
}

export { AnimatedListItem }
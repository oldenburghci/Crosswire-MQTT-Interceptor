import React, {useEffect, useState} from 'react';
import {
    IconButton,
    Typography,
    Box,
    Stack,
    Slider,
    Button,
    Paper, Tooltip, Menu, MenuItem, darken,
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {Brightness4, FlashOff, FlashOn} from "@mui/icons-material";
import axios from "axios";
import useCredentialStore from "../stores/CredentialStore.jsx";
import ColorLensIcon from '@mui/icons-material/ColorLens';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import {ColorPicker, useColor, ColorService} from "react-color-palette";
import "react-color-palette/css";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';
import dayjs from "dayjs";

export default function LightControl(
{
    entityId="light.bedlight_l",
    onChangeHandler = (event) => {},
    initialValues={}
}) {
    console.log(initialValues);
    const [isOn, setIsOn] = useState(false);
    const [friendlyName, setFriendlyName] = useState("");

    const [colorModeActive, setColorModeActive] = useState(null);
    const [color, setColor] = useColor("rgb(213,175,87)");

    const [brightness, setBrightness] = useState(0);
    const [brightnessModeActive, setBrightnessModeActive] = useState(null);

    const [transitionActive, setTransitionActive] = useState(false);
    const [transition, setTransition] = useState(0);

    const [flashActive, setFlashActive] = useState(false);

    const [effects, setEffects] = useState([]);
    const [effectMenuOpen, setEffectMenuOpen] = useState(false);
    const [effectMenuItemIndex, setEffectMenuItemIndex] = useState(-1);
    const [anchorEl, setAnchorEl] = useState(null);

    const [activeControl, setActiveControl] = useState(-1);

    const [bypassUpdate, setBypassUpdate] = useState(false);

    const handleClickListItem = (event) => {
        setAnchorEl(event.currentTarget);
    };

    useEffect(()=>{
        // reset
        if (initialValues !== {})
            return;
        console.log(initialValues);
        setIsOn(()=>false);
        setBrightnessModeActive(()=>null);
        setBrightness(()=>0);
        setColorModeActive(()=>null);
        setColor(ColorService.convert("hex", "rgb(213,175,87)"));

        setTransitionActive(()=>false);
        setTransition(()=>0);
        setFlashActive(()=>false);

        setEffects(()=>[]);
        setEffectMenuItemIndex(()=>-1);
        setFriendlyName(()=>"");
        setActiveControl(()=>-1);
        // the reset of the control element should not trigger an update
        setBypassUpdate(()=>true);
    },[entityId, initialValues]);

    useEffect(() => {
        //fetch
        axios.get(
            `/api/states/${entityId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication' : `Bearer ${useCredentialStore.getState().token}`
                }
            }
        ).then((response)=> {
            const { attributes, state } = response.data;
            console.log(attributes);
            setIsOn(()=>(state === "on"));
            setFriendlyName(()=>attributes?.friendly_name);
            setEffects(()=>attributes?.effect_list);
            // normalize brightness value from [0,255] to [0,100]
            // brightness is possible for basically all color modes
            const supported_color_modes = new Set(attributes?.supported_color_modes);
            // a null value indicates that this color mode is not supported
            setColorModeActive(
                ()=>(supported_color_modes.intersection(
                    new Set(["hs", "xy", "rgb", "rgbw", "rgbww"])).size > 0) ?
                    (state === "on") : null
            );

            setBrightnessModeActive(
                ()=>(supported_color_modes.intersection(
                    new Set(["brightness", "color_temp", "hs", "xy", "rgb", "rgbw", "rgbww"])).size > 0) ?
                    (state === "on") : null
            );
            if(attributes.brightness !== null) {
                setBrightness((100 * attributes?.brightness) / 256);
                //visible slider if brightness active
                setActiveControl(()=>0);
            }
            if(attributes.rgb_color !== null) {
                const initColor = `rgb(${attributes.rgb_color[0]} ${attributes.rgb_color[1]} ${attributes.rgb_color[2]})`;
                setColor(ColorService.convert("hex", initColor));
            }
            return response
        }).then((response)=>{
            const { attributes } = response.data;
            // //merge with initial values
            if (initialValues === {})
              return;
            console.log(initialValues);
            setIsOn(()=>(initialValues.service === "turn_on"));
            setBrightnessModeActive(()=>(initialValues?.brightness_pct));
            setColorModeActive(()=>(initialValues?.rgb_color) ? true : null);
            setTransitionActive(()=>(initialValues.transition));
            setFlashActive(()=>!!(initialValues?.flash));

            setTransition(()=>initialValues.transition);
            setBrightness(()=>(initialValues?.brightness_pct) ? initialValues?.brightness_pct : 25);
            setColor(()=>ColorService.convert("hex", (initialValues?.rgb_color) ?
                `rgb(${initialValues.rgb_color[0]},${initialValues.rgb_color[1]},${initialValues.rgb_color[2]})` :
                "rgb(213,175,87)")
            );
            setEffectMenuItemIndex(()=>attributes.effect_list.indexOf(initialValues?.effect));
            //active control to brightness if brightness_pct active
            if(initialValues?.brightness_pct)
                setActiveControl(()=>0);
        }).catch((error)=> {
            console.error(error);
        })
    }, [entityId, initialValues]);

    useEffect(() => {
        if(!isOn){
            (colorModeActive !== null) && setColorModeActive(false);
            (brightnessModeActive !== null) && setBrightnessModeActive(false);
        }
    }, [isOn]);

    useEffect(() => {
        if (colorModeActive || brightnessModeActive) {
            setIsOn(true);
            (brightness === 0) ? setBrightness(()=>25) : setBrightness(()=>brightness);
        }
    }, [colorModeActive, brightnessModeActive]);

    useEffect(() => {
        if (bypassUpdate){
             setBypassUpdate(()=>false);
             return;
        }
        uploadConfiguration();
    }, [transitionActive, transition, colorModeActive, color, brightnessModeActive, brightness, isOn, flashActive, effectMenuItemIndex]);

    //prepare the data and forward changes to the update function
    const uploadConfiguration = () => {
        const data = {
            entity_id: entityId,
            transition : transitionActive ? transition : 0,
        }
        //conditional data for "on" state
        if (isOn){
            if(effectMenuItemIndex !==-1)
                data.effect = effects[effectMenuItemIndex];
            if(colorModeActive)
                data.rgb_color = [color.rgb.r, color.rgb.g, color.rgb.b];
            if(brightnessModeActive)
                data.brightness_pct = `${brightness}`;
        }
        if (flashActive)
            data.flash = 'long'
        data.service=`${isOn ? "turn_on" : "turn_off"}`;
        data.domain = "light";

        const event = { src: data };
        onChangeHandler(event);
    }

    return (
        <Paper
            elevation={4}
            sx={{
                width: 300,
                minHeight: 470,
                borderRadius: 4,
                mx: 'auto',
                mt: 4,
                pb: 3,
                overflow: 'hidden',
            }}
        >
            {/*Main Content*/}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 3,
                    ml: 1,
                    mr: 1
                }}
            >
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    { friendlyName }
                </Typography>
                {/* Vertical Slider */}
                <Box
                    sx={{
                        height: 240,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        mt: 5
                    }}
                >
                    {/* Slider (transparent rail/track, only thumb visible) */}
                    {
                        (activeControl===0) && <Box
                            sx={{
                                width: 80,
                                height: 220,
                                bgcolor: isOn ? darken(color.hex,0.33) : '#eee',
                                borderRadius: 5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                boxShadow: isOn ? `0 0 12px 2px ${ darken(color.hex,0.33)}` : 'none',
                                transition: 'background 0.3s, box-shadow 0.3s',
                            }}
                        >
                            <Slider
                                orientation="vertical"
                                min={1}
                                max={100}
                                value={isOn ? brightness : 0}
                                onChange={(_, v) => setBrightness(v)}
                                disabled={!isOn}
                                sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    // top: '5%',
                                    height: '90%',
                                    width: 100,
                                    transform: 'translateX(-50%)',
                                    zIndex: 2,
                                    // Hide default track and rail
                                    '& .MuiSlider-rail, & .MuiSlider-track': {
                                        bgcolor: 'transparent',
                                        border: 'none'
                                    },
                                    // Custom thumb
                                    '& .MuiSlider-thumb': {
                                        // top: -5,
                                        width: 64,
                                        height: 0,
                                        borderRadius: 12,
                                        bgcolor: '#e0e0e0',
                                        boxShadow: isOn
                                            ? `0 2px 8px 0 ${color.hex}`
                                            : 'none',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.3s, box-shadow 0.3s',
                                        // Horizontal white bar inside thumb
                                        '&::before': {
                                            top: "8px",
                                            content: '""',
                                            display: 'block',
                                            width: 50,
                                            height: 4,
                                            // borderRadius: "2 4 8 10",
                                            bgcolor: '#fff',
                                            margin: '0 auto',
                                        },
                                    },

                                    '& .MuiSlider-thumb:before': {
                                        // Ensures the white bar is centered
                                        display: 'block',
                                    },
                                    '& .MuiSlider-thumb:after': {
                                        display: 'none',
                                    },
                                    '& .MuiSlider-track' : {
                                        bottom: "-5% !important",
                                        borderRadius: 5,
                                        width: 80,
                                        bgcolor: isOn && color.hex,
                                        boxShadow: isOn ? `0 0 12px 2px ${color.hex}` : 'none',
                                        borderTopLeftRadius: 0,
                                        borderTopRightRadius: 0
                                    }
                                }}
                                aria-label="Brightness"/>
                        </Box>
                    }
                    {
                        (activeControl===1) && <Box>
                            <ColorPicker
                                height={110}
                                color={color}
                                onChange={(v)=>{setColor(v)}}
                                hideAlpha={true}
                                hideInput={["hsv", "hex"]}
                            />
                        </Box>
                    }
                    {
                        (activeControl===2) && <Box
                        >
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimeClock
                                    views={['seconds']}
                                    value={dayjs().set('hour',0).set('minute',0).set('second',transition)}
                                    onChange={
                                        (v)=> {
                                            setTransition(v.$s);
                                        }
                                    }
                                />
                            </LocalizationProvider>
                        </Box>
                    }
                </Box>
                {/* CONTROL BUTTONS */}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    {/*Power*/}
                    <Tooltip title={`Power ${(isOn) ? "off": "on" }`}>
                        <IconButton
                            color={ isOn ? "primary" : "default"}
                            onClick={
                                () => {
                                    setIsOn((v) => !v);
                                }
                            }
                            sx={{
                                border: isOn ? "2px solid" : "2px solid transparent",
                            }}
                        >
                            <PowerSettingsNewIcon />
                        </IconButton>
                    </Tooltip>
                    {/*Brightness*/}
                    { (brightnessModeActive === null) ? (
                        <Tooltip title={"This device doesn't support brightness adjustments"}>
                            <IconButton>
                                <Brightness4 color={"disabled"} />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title={"Adjust Brightness"}>
                            <IconButton
                                color={ brightnessModeActive ? "primary" : "default" }
                                onClick={
                                    () => {
                                        setBrightnessModeActive( () => !brightnessModeActive );
                                        setActiveControl(0);
                                    }
                                }
                                onMouseOver={()=>{ setActiveControl(0); }}
                                sx={{
                                    border: brightnessModeActive ? `2px solid` : '2px solid transparent',
                                }}
                            >
                                <Brightness4/>
                            </IconButton>
                        </Tooltip>
                        )
                    }
                    {/*Color Mode Control*/}
                    {
                        (colorModeActive === null) ? (
                            <Tooltip title={"This device doesn't support light colors"}>
                                <IconButton>
                                    <ColorLensIcon color={"disabled"}/>
                                </IconButton>
                            </Tooltip>
                            ) : (
                            <Tooltip title={"Adjust Color"}>
                                <IconButton
                                    color={(colorModeActive) ? 'primary' : 'default'}
                                    onClick={
                                        () => {
                                            setColorModeActive(() => !colorModeActive);
                                            setActiveControl(1);
                                        }
                                    }
                                    onMouseOver={()=>{ setActiveControl(1); }}
                                    sx={{
                                        border: colorModeActive ? `2px solid` : '2px solid transparent',
                                    }}
                                >
                                    <ColorLensIcon />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    {/*Transition Control*/}
                    { (transitionActive !== null) &&
                        <Tooltip title={"Set Transition Timer"}>
                            <IconButton
                                color={(transitionActive) ? 'primary' : 'default'}
                                onClick={
                                    ()=>{
                                        setTransitionActive( () => !transitionActive );
                                        setActiveControl(2);
                                    }
                                }
                                onMouseOver={()=>{ setActiveControl(2); }}
                                sx={{
                                    border: transitionActive ? `2px solid` : '2px solid transparent',
                                }}
                            >
                                <TimelapseIcon/>
                            </IconButton>
                        </Tooltip>
                    }
                    {/*Flash active*/}
                    <Tooltip title={(flashActive) ? "Flash is active" : "Flash is deactivate"}>
                        <IconButton
                            color={(flashActive) ? 'primary' : 'default'}
                            onClick={
                                ()=>{
                                    setFlashActive(v=>!v);
                                }
                            }
                            sx={{
                                border: flashActive ? `2px solid` : '2px solid transparent',
                            }}
                        >
                            {(flashActive) ? <FlashOn color={'primary'}/> : <FlashOff color={'default'} />}
                        </IconButton>
                    </Tooltip>

                </Stack>
                {/* Effect Button */}
                { (isOn) && <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon/>}
                    color={ (effectMenuItemIndex === -1) ? "#fff" : "primary"}
                    sx={{
                        mt: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        border: "2px solid",
                    }}
                    onClick={(event) => {
                        setEffectMenuOpen(() => !effectMenuOpen);
                        handleClickListItem(event)
                    }}

                >
                    <Typography >
                        {(effectMenuItemIndex === -1) ? 'Effect' : `${effects[effectMenuItemIndex]}`}
                    </Typography>
                    <Menu
                        open={effectMenuOpen}
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
                        {
                            (effects.length > 0) && effects.map((item, index) => {
                                return <MenuItem
                                    key={index}
                                    onClick={() => setEffectMenuItemIndex(index)}
                                >
                                    {item}
                                </MenuItem>
                            })
                        }
                    </Menu>
                </Button>}
            </Box>
        </Paper>
    );
}

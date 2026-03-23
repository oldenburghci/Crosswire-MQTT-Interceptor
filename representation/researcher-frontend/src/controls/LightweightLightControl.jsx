import {Box, darken, Paper, Slider} from "@mui/material";
import "react-color-palette/css";
import {ColorPicker, useColor} from "react-color-palette";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {TimeClock} from "@mui/x-date-pickers/TimeClock";
import dayjs from "dayjs";
import {useState} from "react";

export default function LightweightLightControl({
    activeControlElement = -1,
    transition = 0,
    setTransition=(v) => {},
    // the color update must be forwarded with this update function,
    initColor="rgb(213, 175, 87)",
    updateColor=(color)=>{},
    brightness=0,
    setBrightness=(v)=>{}
}) {
    // console.log(initColor);
    const [color, setColor] = useColor(initColor);
    //internal states reduce the amount of updates in the parent component
    const [internalBrightness, setInternalBrightness] = useState(brightness);
    const [internalTransition, setInternalTransition] = useState(transition);
    // console.log(data);

    return (
        <Paper
            elevation={4}
            sx={{
                // width: 300,
                minHeight: 300,
                borderRadius: 4,
                mx: 'auto',
                mt: 4,
                pb: 3,
                overflow: 'hidden',
            }}
        >
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
                    (activeControlElement===0) && <Box
                        sx={{
                            width: 80,
                            height: 220,
                            bgcolor: darken(color.hex,0.33),
                            // filter: brightness('85%'),
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: `0 0 12px 2px ${ darken(color.hex,0.33)}`,
                            transition: 'background 0.3s, box-shadow 0.3s',
                        }}
                    >
                        <Slider
                            orientation="vertical"
                            min={1}
                            max={100}
                            value={ internalBrightness }
                            onChange={ (_, v) => setInternalBrightness(v)}
                            onChangeCommitted={(_,v) => setBrightness(v)}
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
                                    boxShadow: `0 2px 8px 0 ${color.hex}`,
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
                                    // transform: 'translateY(22%) translateX(-50%)',
                                    width: 80,
                                    bgcolor: color.hex,
                                    boxShadow: `0 0 12px 2px ${color.hex}` ,
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    // paddingTop: '10%'
                                }
                            }}
                            aria-label="Brightness"/>
                    </Box>
                }
                {
                    (activeControlElement===1) && <Box>
                        <ColorPicker
                            height={110}
                            color={color}
                            onChange={(v)=>{
                                setColor(v);
                            }}
                            hideAlpha={true}
                            hideInput={["hsv", "hex"]}
                            onChangeComplete={(v)=>{
                                const { r, g, b } = v.rgb;
                                updateColor(`rgb(${r}, ${g}, ${b})`);
                            }}
                        />
                    </Box>
                }
                {
                    (activeControlElement===2) && <Box
                    >
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <TimeClock
                                views={['seconds']}
                                value={dayjs().set('hour',0).set('minute',0).set('second',internalTransition)}
                                onChange={
                                    (v, state)=> {
                                        setInternalTransition(v.$s);
                                        if(state === "finish")
                                            setTransition(v.$s);
                                    }
                                }
                            />
                        </LocalizationProvider>
                    </Box>
                }
            </Box>
        </Paper>

    )

}
import {AnimatedListItem} from "../base/LightListItem.jsx";
import {useSpring} from "@react-spring/web";
import {Badge, Divider, Grid2, IconButton, Paper, Stack, Tooltip} from "@mui/material";
import {Brightness4, CircleRounded, East, Help, HelpOutline} from "@mui/icons-material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import React from "react";

export default function LightStateListItem(props) {

    const {style, index} = props;
    const data = props.data[index];

    const {
        on,
        onConflict,
        brightness,
        brightnessConflict,
        brightnessPct,
        brightnessPctConflict,
        rgbColor,
        rgbColorConflict,
        color,
        colorConflict,
        effect,
        effectConflict,
        effectName,
    } = data

    const appearProps = useSpring({
        opacity: 1,
        from: {
            opacity: 0,
        }
    });

    return (
        <AnimatedListItem
            style={{paddingRight: 10,...style, ...appearProps}}
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
                {/*Indicator Icon*/}
                {/*<Grid2 size={1}>*/}
                {/*    <East/>*/}
                {/*</Grid2>*/}
                <Grid2 size={11}>
                    <Paper
                        elevation={8}
                        sx={{borderRadius: 4, minHeight: 40, minWidth: 100}}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                justifyContent: "space-evenly",
                            }}
                        >
                            {/*Power Indicator*/}
                            <Tooltip title={(on) ? "Power is on" : "Power is off"}>
                                <IconButton
                                    color={on ? "primary" : "default"}
                                    sx={{
                                        border: on ? "2px solid" : "2px solid transparent",
                                    }}
                                >
                                    <PowerSettingsNewIcon/>
                                </IconButton>
                            </Tooltip>
                            {/*Brightness Indicator*/}
                            { (brightness === undefined) ? (
                                <Tooltip title={"This device doesn't support brightness adjustments"}>
                                    <IconButton>
                                        <Brightness4 color="disabled" />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title={(brightness) ? "Brightness is active" : "Brightness is inactive"}>
                                    <Badge
                                        badgeContent={brightnessPct}
                                        invisible={!(brightness ) || !on}
                                        color={brightness ? "primary" : "default"}
                                    >
                                        <IconButton
                                            color={brightness ? "primary" : "default"}
                                            sx={{
                                                border: brightness ? "2px solid" : "2px solid transparent",
                                            }}
                                        >
                                            <Brightness4/>
                                        </IconButton>
                                    </Badge>
                                </Tooltip>
                                )
                            }
                            {/*Color Indicator*/}
                            { (rgbColor === undefined) ? (
                                <Tooltip title={"This device doesn't support light colors"}>
                                    <IconButton>
                                        <ColorLensIcon color="disabled"/>
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title={(rgbColor  ? "Color is set"  : "No color set")}>
                                    <Badge
                                        badgeContent={rgbColor ? <CircleRounded sx={{color: color}} /> : <></>}
                                        invisible={ (!rgbColor || !on) }
                                    >
                                        <IconButton
                                            color={rgbColor ? "primary" : "default"}
                                            sx={{
                                                border: rgbColor ? "2px solid" : "2px solid transparent",
                                            }}
                                        >
                                            <ColorLensIcon/>
                                        </IconButton>
                                    </Badge>
                                </Tooltip>
                                )
                            }
                            {/*Effect*/}
                            <Tooltip title={(effect) ? `Effect ${effectName} active` : "No effect set" }>
                                <IconButton
                                    color={effect ? "primary" : "default"}
                                    sx={{
                                        border: effect ? "2px solid" : "2px solid transparent",
                                    }}
                                >
                                    <AutoAwesomeIcon/>
                                </IconButton>
                            </Tooltip>
                            {/* Explain   */}
                            <Divider orientation={"vertical"} flexItem variant="middle" color="secondary" />
                            <IconButton>
                                <Help/>
                            </IconButton>
                        </Stack>
                    </Paper>
                </Grid2>

            </Grid2>
        </AnimatedListItem>
    )
}
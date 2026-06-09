import {Box, IconButton, Paper, Stack, Switch, Tooltip, Typography} from "@mui/material";
import {Delete} from "@mui/icons-material";
import {animated, useSpring} from "@react-spring/web";


export default function SwitchStateItem ({
    props
}){
    const { index } = props;
    const data = props.data[index];
    const { on, setOn, onDelete, friendlyName, isReadOnly, entityId } = data;

    const AnimatedPaper = animated(Paper);

    const appearProps = useSpring({
        opacity:  1,
        from: {
            opacity:  0,
        },
    })

    return (
        <AnimatedPaper
            style={{...appearProps}}
            elevation={6}
            sx={{
                borderRadius:  2,
                minHeight: 40,
                p:1
            }}
        >
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <Box
                    color="primary"
                    sx={{
                        border: "1px solid",
                        borderColor: (on) ? "#90CAF9" : "",
                        borderRadius: 1,
                        pt: 1, pb: 1
                    }}
                    >
                    <Tooltip title={on ? "Switch is active" : "Switch is inactive"}>
                        <Switch
                            checked={on}
                            onChange={() => {
                                setOn(!on, index, props.data);
                            }}
                            sx={{
                                transform: "rotate(90deg)",
                                '& .MuiSwitch-thumb': {
                                    borderRadius: 0.5,
                                    height: 22,
                                    width: 16,
                                },
                                '& .MuiSwitch-track': {
                                    width: '100%',
                                    height: 22,
                                    transform: "translateY(-3px)",
                                    borderRadius: 0.5,
                                    backgroundColor: '#d2d7e8'
                                }
                            }}
                        />
                    </Tooltip>
                </Box>
                <Tooltip title={friendlyName}>
                    <Typography variant="body1" component="div" noWrap>
                        {friendlyName}
                    </Typography>
                </Tooltip>

                {(!isReadOnly) && <Tooltip title={`Remove '${friendlyName}' from Configuration`}>
                    <IconButton
                        color={(on) ? "primary" : ""}
                        onClick={
                            () => {
                                onDelete(props.data,entityId);
                            }
                        }
                    >
                        <Delete/>
                    </IconButton>
                </Tooltip>}
            </Stack>
        </AnimatedPaper>
    )

}
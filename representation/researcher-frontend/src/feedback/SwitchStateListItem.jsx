import {AnimatedListItem} from "../base/LightListItem.jsx";
import {Box, Stack, Switch, Tooltip, Typography} from "@mui/material";
import {useSpring} from "@react-spring/web";

export default function SwitchStateListItem(props) {

    const { style, index } = props;
    const data = props.data[index];
    const { on, friendlyName, hideName } = data;

    const appearProps = useSpring({
        opacity: 1,
        from: {
            opacity: 0,
        }
    });

    return(
        <AnimatedListItem
            style={{paddingRight: 10, ...style,...appearProps}}
            className={index % 2 === 0 ? "RowEven" : "RowOdd"}
        >
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    justifyContent: "flex-end",
                    alignItems: "center",
                    minWidth: 0
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    {(!hideName) && (
                        <Tooltip title={friendlyName}>
                            <Typography variant="body1" component="div" sx={{wordBreak: "break-word", width: 120}} noWrap>
                                {friendlyName}
                            </Typography>
                        </Tooltip>
                    )}
                </Box>

                <Box
                    color="primary"
                    sx={{
                        border: "1px solid",
                        borderColor: (on) ? "#90CAF9" : "",
                        borderRadius: 1,
                        pt: 1, pb: 1,
                        display: "flex",
                        justifyContent: "flex-end"
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
            </Stack>
        </AnimatedListItem>
    )
}
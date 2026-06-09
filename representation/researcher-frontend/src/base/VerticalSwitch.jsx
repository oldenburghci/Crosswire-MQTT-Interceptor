import {Box, Switch, Tooltip} from "@mui/material";

export default function VerticalSwitch({
    on,
    onChange = () => {},
    tooltips = ["Switch is active", "Switch is inactive"]
}) {

    return (
        <Box
            color="primary"
            sx={{
                border: "1px solid",
                borderColor: (on) ? "#90CAF9" : "",
                borderRadius: 1,
                pt: 1, pb: 1
            }}
        >
            <Tooltip title={on ? tooltips[0] : tooltips[1]}>
                <Switch
                    checked={on}
                    onChange={
                        ()=>onChange()
                    }
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

    )
}
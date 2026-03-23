import {IconButton, Stack, Tooltip, Typography} from "@mui/material";
import {Add} from "@mui/icons-material";

export default function ChipLabelMenu({
    label="",
    show=true,
    tooltip="Add another trigger to this definition",
    onAdd=()=>{}
}) {


    return (
        <Stack
            direction="row"
            sx={{
                // justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            {(show) && (
                <Tooltip title={tooltip}>
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={onAdd}
                    >
                        <Add/>
                    </IconButton>
                </Tooltip>
            )}
            <Typography variant="body2">
                { label }
            </Typography>
    </Stack>
    )
}
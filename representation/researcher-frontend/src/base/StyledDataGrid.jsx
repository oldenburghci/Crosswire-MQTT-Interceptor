import {styled} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";

// a whitespace between & and :: is intended here
export const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
    "& ::-webkit-scrollbar": {
        width: "16px"
    },
    "& ::-webkit-scrollbar-track": {
        backgroundColor: "rgb(255 255 255 / 10%)",
    },
    "& ::-webkit-scrollbar-thumb": {
        borderRadius: "16px",
        backgroundColor: "grey",
        backgroundImage: "linear-gradient(45deg, #a68eff, #90caf9)"
    }
}));


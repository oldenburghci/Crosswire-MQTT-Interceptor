import {Typography} from "@mui/material";

export default function ModalHeader({
    children,
}){
    return (
        <Typography
            id="modal-modal-title"
            variant="h5"
            // component="h3"
            className={"modal-header"}
            sx={{pt:1, pb:1}}
        >
            {...children}
        </Typography>
    )

}


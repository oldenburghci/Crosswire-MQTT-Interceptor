import {FormControlLabel, Grid, Grid2, Switch, Tooltip} from "@mui/material";
import {useState} from "react";

export default function ToggleSwitch(props={
    state: true,
    updateFx: ()=>{},
    label: 'sample',
    tooltip: 'default'
}){
    // console.log(props)
    return <>
            <Grid2 component="label" container alignItems="center" spacing={1} columnSpacing={0}>
                {
                    (props.tooltip !== 'default' || props.tooltip === undefined) && <Tooltip title={props.tooltip} placement="top" arrow>
                        <Switch checked={props.state}
                                size={"medium"}
                                onChange={
                                    (checked) => {
                                        props.updateFx((prevCheck) => !prevCheck)
                                    }
                                }
                                sx={{margin: "2px 5px 2px 10px",}}
                        />
                    </Tooltip>
                }
                <p>{props.label}</p>
            </Grid2>

    </>
}
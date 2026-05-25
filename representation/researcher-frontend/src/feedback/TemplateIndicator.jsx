import {West} from "@mui/icons-material";
import {ButtonBase, Chip, Tooltip} from "@mui/material";
import React, {useEffect, useState} from "react";
import JsonView from "react18-json-view";

export default function TemplateIndicator({
    template={json: {}, plain: ""},
    active=undefined,
    sx={}
}) {

    //flag indicates if the template has a json or not
    const [flag, setFlag] = useState(false);

    useEffect(()=>{
        if(active !== undefined) {
            setFlag(active)
            return;
        }
        //infer state
        if(template?.json) {
            setFlag(true);
            return;
        }
        if(template?.plain) {
            setFlag(false);
        }
    },[template, active]);

    return (
        <ButtonBase>
            <Tooltip title={(flag) ? <JsonView src={template.json} editable={false}/> : `plain: ${template.plain}`}>
                <Chip
                    sx={{...sx}}
                    label={(flag) ? "json" : "plain"}
                    size="small"
                    color="secondary"
                    avatar={
                        <West sx={{ borderRadius: "10px"}}/>
                    }
                />
            </Tooltip>
        </ButtonBase>

    )
}
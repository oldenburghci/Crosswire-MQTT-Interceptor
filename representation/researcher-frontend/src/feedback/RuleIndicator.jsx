import {ButtonBase, Chip, Tooltip} from "@mui/material";
import {East} from "@mui/icons-material";
import React, {useEffect, useState} from "react";
import JsonView from "react18-json-view";

export default function RuleIndicator({
    rule={json : {}, plain : ""},
    active=-1,
    sx={}
}) {

    const [i , setI] = useState(0)

    useEffect(() => {
        // externally set
        if (active !== -1) {
            setI(active);
            return;
        }
        // nothing set, infer
        if (rule?.json) {
            setI(0);
            return;
        }
        if(rule?.plain) {
            setI( (rule.plain !== "*") ? 1 : 2 );
        }
    }, [rule, active]);

    return (
        <ButtonBase>
            <Tooltip title={[<JsonView src={rule.json} editable={false}/>, `plain: ${rule.plain}`, "all messages" ].at(i)}>
                <Chip
                    sx={{...sx}}
                    label={
                        ["json", "plain", "all"].at(i)
                    }
                    size="small"
                    color="primary"
                    avatar={
                        <East sx={{ borderRadius: "10px"}}/>
                    }
                />
            </Tooltip>
        </ButtonBase>
    )
}

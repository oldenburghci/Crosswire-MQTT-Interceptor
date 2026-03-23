import {IconButton, ListItem, ListItemButton, ListItemText, Tooltip} from "@mui/material";
import "./TopicsListItem.css";
import {CircleOutlined, CircleRounded} from "@mui/icons-material";
import TemplateIndicator from "../feedback/TemplateIndicator.jsx";
import RuleIndicator from "../feedback/RuleIndicator.jsx";
import React from "react";

export default function TopicsListItem (
    props
){
    const {style, index} = props;
    const data = props.data[index];
    //use type to differentiate between suppressed and intercepted topics...
    const { type, intended, alreadyHandled, topic } = data;
    const { template, rule } = (type==="intercept") ? data : { template: {}, rule: {} };
    // console.log(data);

    return (
        <ListItem
            style={ {paddingRight: 10, ...style} }
            component="div"
            disablePadding
            className={(index % 2 === 0) ? "RowEven" : "RowOdd"}
        >
            { (type === "suppress") && (
                <IconButton sx={{ ml: 2, mr: 2}}>
                    { (intended && !alreadyHandled) && (
                        <Tooltip title={"This topic will be suppressed"}><CircleOutlined color="primary"/></Tooltip>
                    )}
                    { (intended && alreadyHandled) && (
                        <Tooltip title={"This topic is suppressed"}><CircleRounded color="primary"/></Tooltip>
                    ) }
                    { (!intended && alreadyHandled) && (
                        <Tooltip title={"This topic is not part of the current configuration but is already suppressed"}><CircleRounded color="warning"/></Tooltip>
                    )}
                    { (!intended && !alreadyHandled) && (
                        <Tooltip title={"Should this ever happen?"}><CircleRounded color="warning"/></Tooltip>
                    )}
                </IconButton>)
            }
            { (type === "intercept") && (
                <IconButton sx={{ ml: 2, mr: 2}}>
                    { (intended && !alreadyHandled) && (
                        <Tooltip title={"This topic will be intercepted"}><CircleOutlined color="primary"/></Tooltip>
                    )}
                    { (intended && alreadyHandled) && (
                        <Tooltip title={"This topic is intercepted"}><CircleRounded color="primary"/></Tooltip>
                    ) }
                    { (!intended && alreadyHandled) && (
                        <Tooltip title={"This topic is not part of the current configuration but is already intercepted"}><CircleRounded color="warning"/></Tooltip>
                    )}
                    { (!intended && !alreadyHandled) && (
                        <Tooltip title={"Should this ever happen?"}><CircleRounded color="warning"/></Tooltip>
                    )}
                </IconButton>)
            }
            {/*<ListItemButton>*/}
            <ListItemText primary={topic}/>
            {type === "intercept" &&(
                <>
                    <RuleIndicator
                        sx={{mr:1}}
                        rule={ rule }
                    />
                    <TemplateIndicator
                        sx={{mr:1}}
                        template={ template }
                    />
                </>
            )}
            {/*</ListItemButton>*/}
        </ListItem>
    );
}

// export default function renderTopicListItemRow()
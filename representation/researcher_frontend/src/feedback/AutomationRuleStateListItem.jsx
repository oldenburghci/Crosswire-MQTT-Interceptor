import {Chip, Grid2, ListItem, Stack, Tooltip, Typography} from "@mui/material";
import VerticalSwitch from "../base/VerticalSwitch.jsx";
import JsonView from "react18-json-view";


export default function AutomationRuleStateListItem(props) {

    const { index, data } = props;
    const {
        friendlyName = "",
        on = false,
        hideName,
        triggers =[],
        conditions =[],
        actions =[],
        key = `${Math.random().toString(36).substr(2, 4)}`,
    } = data[index];

    return <ListItem>
        <Grid2 container size={12} className={index % 2 === 0 ? "RowEven" : "RowOdd"} sx={{pl:2}}>

            <Grid2 size={3}>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        alignItems: "center",
                        mt: 1.7
                    }}
                >
                    {
                        (hideName === false) && (
                            <Tooltip title={`${friendlyName}`}>
                                <Typography variant="body1" component="div" sx={{wordBreak: "break-word", width: 120}} noWrap>
                                    {friendlyName}
                                </Typography>
                            </Tooltip>

                        )
                    }

                    <VerticalSwitch
                        on={on}
                        tooltips={[`Rule ${friendlyName} will be active`, `Rule ${friendlyName} will be inactive`]}
                    />
                </Stack>
            </Grid2>
            <Grid2 size={8} sx={{m:0.5}} >
                <Grid2
                    container
                    size={12}
                    sx={{mb:0.25}}
                    spacing={0.25}
                >
                    {
                        triggers.map((item, index) => {
                            return(
                                <Chip
                                    key={`${(hideName) ? 'target' : 'current'}-indicator-automation-trigger-${key}`}
                                    label={
                                        <Tooltip title={<JsonView src={item.triggers}  editable={false}/>}>
                                            {item.friendlyName}
                                        </Tooltip>
                                    }
                                    color="secondary"
                                    size="small"

                                />
                            )
                        })
                    }
                </Grid2>
                <Grid2
                    container
                    size={12}
                    sx={{mb:0.25}}
                    spacing={0.25}
                >
                    {
                        conditions.map((item, index) => {
                            return(
                                <Chip
                                    key={`${(hideName) ? 'target' : 'current'}-indicator-automation-condition-${key}`}
                                    label={
                                        <Tooltip title={<JsonView src={item.conditions}  editable={false}/>}>
                                            {item.friendlyName}
                                        </Tooltip>
                                    }
                                    color="warning"
                                    size="small"

                                />
                            )
                        })
                    }
                </Grid2>
                <Grid2
                    container
                    size={12}
                    sx={{mb:0.25}}
                    spacing={0.25}
                >
                    {
                        actions.map((item, index) => {
                            return(
                                <Chip
                                    key={`${(hideName) ? 'target' : 'current'}-indicator-automation-action-${key}`}
                                    label={
                                        <Tooltip title={<JsonView src={item.actions}  editable={false}/>}>
                                            {item.friendlyName}
                                        </Tooltip>
                                    }
                                    color="primary"
                                    size="small"

                                />
                            )
                        })
                    }
                </Grid2>


            </Grid2>

        </Grid2>
    </ListItem>
}
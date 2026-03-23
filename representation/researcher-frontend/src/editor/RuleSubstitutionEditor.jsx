import {
    Box,
    CircularProgress,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Typography
} from "@mui/material";
import DropDownRow from "../base/DropDownRow.jsx";
import useRulesStore from "../stores/RulesStore.jsx";
import {useEffect, useState} from "react";
import axios from "axios";
import _ from "lodash";
import {StyledDataGrid} from "../base/StyledDataGrid.jsx";

//no whitespace between & and :: is intended here
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    "&::-webkit-scrollbar": {
        width: "16px"
    },
    "&::-webkit-scrollbar-track": {
        backgroundColor: "rgb(255 255 255 / 10%)",
    },
    "&::-webkit-scrollbar-thumb": {
        borderRadius: "16px",
        backgroundColor: "grey",
        backgroundImage: "linear-gradient(45deg, #a68eff, #90caf9)"
    },

    "& .MuiTable-root": {
        border: '1px solid rgba(81, 81, 81, 1)'
    }
}));


export default function RuleSubstitutionEditor() {
    //TODO: get the information from the RulesEditor which rules are selected for the further configuration process

    const [originalRules, setOriginalRules] = useState([
       /* {alias: 'Rule X_0', options: ['Option A', 'Option B']},
        {alias: 'Rule X_1', options: ['Option A', 'Option B']},*/
    ]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // subscribe to updates of the selectedRuleIds property of this store
        useRulesStore.subscribe((state) => state.selectedRules, (rules) => {
            //reset old data
            setOriginalRules(()=>[]);
            setLoading(()=>true);
            // console.log(rules);
            //TODO: make remote call to api to get further information about this automation rule
            const promises = [];
            const dataCollector = [];
            const triggersToIds = {}
            const compatibleRuleIds = {};
            for (let rule of rules) {
                const promise = axios.get(
                    `api/config/automation/config/${rule.internal_id}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI5ODBiNWU4NTkyOTY0MTBiYTM2ZGM1NTVkMWY3ZDJlMSIsImlhdCI6MTczMDc5NTQ3MiwiZXhwIjoyMDQ2MTU1NDcyfQ.deVQ-3lHLb9TcpqvfiquyoZOKQAws5Cyq1UdeGulUsI' ,
                        }
                    }
                ).then((response) => {
                    const { data } = response;
                    console.log(data);
                    data.options = [];
                    dataCollector.push(data);
                    // let's start by taking only the first trigger
                    triggersToIds[data.id] = data.triggers[0];
                    compatibleRuleIds[data.id] = new Set();
                }).catch((error) => {
                    console.error(error);
                    setLoading(()=>false);
                });
                promises.push(promise);
            }
            Promise.allSettled(promises).then(()=>{
                console.log('all promises settled');
                //infer what rule is substitutable
                for(let currentKey in triggersToIds) {
                    const currentTrigger = triggersToIds[currentKey];
                    for(let nextKey in triggersToIds) {
                        const nextTrigger = triggersToIds[nextKey];
                        if(!_.isEqual(currentTrigger, nextTrigger))
                            continue
                        // console.log({currentTrigger, nextTrigger})
                        compatibleRuleIds[currentKey].add(nextKey);
                    }
                }
                for (let currentKey in compatibleRuleIds) {
                    const compatibleIds = compatibleRuleIds[currentKey];
                    console.log(compatibleIds);
                    const datapoint = dataCollector.find((entry) => { return entry.id === currentKey });
                    for (let id of compatibleIds ) {
                        const rule = dataCollector.find((entry) => { return entry.id === id });
                        datapoint.options.push(rule.alias)
                    }
                }
                setLoading(()=>false);
                setOriginalRules(()=>dataCollector);
            })
        });

        return () => {}

    }, []);


    return <>
        <Box>
        <Typography>Substitute Rules</Typography>
        <StyledTableContainer sx={{height: '75vh', m: 2}}>
            <Table stickyHeader size={"small"}>
                <TableHead>
                    <TableRow>
                        <TableCell align={"center"} colSpan={6}>Rule</TableCell>
                        <TableCell align={"center"} colSpan={6}>Substitute with</TableCell>
                    </TableRow>
                </TableHead>
                {loading && <CircularProgress />}
                <TableBody>
                    {
                        originalRules.map((rule) => {
                            return <DropDownRow originalRule={rule.alias} options={rule.options}/>
                        })
                    }
                </TableBody>
            </Table>
        </StyledTableContainer>

        </Box>
    </>
}
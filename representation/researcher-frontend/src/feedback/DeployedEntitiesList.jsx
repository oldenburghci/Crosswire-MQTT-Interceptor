import {useEffect, useMemo, useState} from "react";
import {Box, Grid2, Skeleton, Stack, Typography} from "@mui/material";
import {FixedSizeList} from "react-window";
import LightListItem from "../base/LightListItem.jsx";
import LightStateListItem from "./LightStateListItem.jsx";
import {factoryChain} from "../factories/FactoryChain.js";

export default function DeployedEntitiesList({
    entities = new Map(),
    reload = false,
    displayDomain="light",
    displayItems={ target: LightListItem, current: LightStateListItem },
    styles={
        itemHeight: 65,
        currentGridSize: 5,
        targetGridSize: 6
    }

}) {
    // --- memos ----
    const {targetStates} = useMemo(() => {
        const targetItems = [];
        for (const [key, value] of entities ){
            const domain = key.split('.')[0]
            if (domain !== displayDomain ) continue
            const target = {...value, isReadOnly: true, hideName: false}
            targetItems.push(target);
        }
        targetItems.sort((a, b) => (a.entityId < b.entityId) ? 1 : -1);
        return {
            targetStates: targetItems,
        }
    }, [entities]);
    // --- states ----
    const [loading, setLoading] = useState(true);
    const [currentStates, setCurrentStates] = useState([]);
    // --- effects ---

    useEffect(() => {
        setLoading(()=>true);
        // check the current state of the target devices to display them side by side
        const promisesCollector = [];
        const entitiesCollector = [];
        const fetchedStates = [];
        targetStates.forEach((entity) => {
            entitiesCollector.push(entity.entityId)
        });
        entitiesCollector.forEach(
            (item, _) => {
                const p = factoryChain.handle(displayDomain, item).then(result => {
                    result.hideName = true;
                    fetchedStates.push(result)
                });
                promisesCollector.push(p);
            }
        );
        Promise.allSettled(promisesCollector).then(
            ()=>{
                //settle and sort
                fetchedStates.sort((a,b) => (a.entityId < b.entityId) ? 1 : -1 );
                setCurrentStates(fetchedStates);
                setLoading(()=>false)
            }
        )
    }, [targetStates, reload]);

    return (
        <Box
            sx={{
                minHeight: (targetStates === undefined) ? styles.itemHeight : styles.itemHeight*targetStates.length,
                borderRadius: 10,
            }}
        >
            <Grid2
                container
                size={12}
            >
                { (loading || reload) && <Grid2 size={12}>
                            <Stack direction="row" sx={{m: 0.5, pt: 1, justifyContent: "space-evenly", height:45}}>
                                <Skeleton variant="rounded" width={"30%"} />
                                <Skeleton variant="rounded" width={"30%"} />
                            </Stack>
                            <Stack spacing={2} direction="row"  sx={{m:0.5, mb: 0, pt:1, height: styles.itemHeight}} >
                                <Skeleton variant="rounded" width={"50%"}   sx={{m:1}} height={"100%"}/>
                                <Skeleton variant="rounded" width={"100%"}  sx={{m:1}} height={"100%"}/>

                            </Stack>
                            <Stack spacing={2} direction="row"  sx={{m:0.5, mb: 0, pt:1, height: styles.itemHeight}} >
                                <Skeleton variant="rounded" width={"100%"}  sx={{m:1}} height={"100%"}/>
                                <Skeleton variant="rounded" width={"60%"} sx={{m:1}} height={"100%"}/>
                            </Stack>
                </Grid2> }
                {
                    (!loading && !reload )  && (
                        <Grid2 size={12} container>
                            <Grid2 size={styles.targetGridSize}>
                                {(targetStates.length > 0) && (
                                    <>
                                        <Typography variant="body" component="div">Target</Typography>
                                        <FixedSizeList
                                            height={targetStates.length * styles.itemHeight}
                                            itemSize={styles.itemHeight}
                                            itemCount={targetStates.length}
                                            overscanCount={5}
                                            itemData={targetStates}
                                        >
                                            {
                                                displayItems.target
                                            }
                                        </FixedSizeList>
                                    </>)}
                            </Grid2>
                            <Grid2 size={12 - ( styles.currentGridSize + styles.targetGridSize )}/>
                            <Grid2 size={styles.currentGridSize}>
                                {(currentStates.length > 0) && (
                                    <>
                                        <Typography variant="body" component="div">Current</Typography>
                                        <FixedSizeList
                                            height={targetStates.length * styles.itemHeight}
                                            itemSize={styles.itemHeight}
                                            itemCount={targetStates.length}
                                            overscanCount={5}
                                            itemData={currentStates}
                                        >
                                            {
                                                displayItems.current
                                            }
                                        </FixedSizeList>
                                    </>)}
                            </Grid2>
                        </Grid2>
                    )
                }
            </Grid2>
        </Box>
    )

}
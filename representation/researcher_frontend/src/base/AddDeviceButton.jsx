import {
    Button, ButtonBase,
    ButtonGroup, CircularProgress,
    ClickAwayListener, Grid2,
    Grow,
    MenuItem, MenuList,
    Paper,
    Popper, Stack,
    Tooltip, Typography,
} from "@mui/material";
import {Add, SortByAlpha} from "@mui/icons-material";
import {useEffect, useMemo, useRef, useState} from "react";
import {useSpring, animated} from '@react-spring/web';
import {ArrowDropDownIcon} from "@mui/x-date-pickers";

export default function AddDeviceButton({
    options=[],
    onAdd=(arg)=>{},
    tooltip="Add another device to the configuration"
}) {
    const [clicked, setClicked] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const anchorRef = useRef(null);
    const [selectedSorting, setSelectedSorting ] = useState(-1);
    const [sortedOptions, setSortedOptions] = useState([]);

    const [sortingReady, setSortingReady] = useState(false);

    const AnimatedButton = animated(Button);

    const propsLeftExpand = useSpring({
        width: (clicked) ?  100  : 0,
        visibility: (clicked) ? 'visible' : 'hidden',
        from: {
            width: (clicked) ? 0 : 100,
            visibility: (clicked) ? 'hidden' : 'visible',
        },
    });

    useEffect(() => {
        if (selectedIndex !== -1){
            setOpen(()=>false);
            setClicked(()=>false);
            onAdd(options[selectedIndex]);
        }
        setSelectedIndex(-1);
    }, [selectedIndex])

    const propsBorderRadius = useSpring({
        // borderRadius: (clicked) ? "25px 25px 25px 25px" : 0 ,
        borderTopLeftRadius: (clicked) ? 25 : 2,
        borderBottomLeftRadius: (clicked) ? 25 : 2,
        borderTopRightRadius: (clicked) ? 0 : 2,
        borderBottomRightRadius: (clicked) ? 0 : 2,
        from: {
            borderTopLeftRadius: (clicked) ? 25 : 2,
            borderBottomLeftRadius: (clicked) ? 25 : 2,
            borderTopRightRadius: (clicked) ? 0 : 2,
            borderBottomRightRadius: (clicked) ? 0 : 2,
        }
    })

    const handleClose = ()=>{
        setOpen(false);
        setClicked(false);
    }

    useEffect(()=>{
        if(selectedSorting === 0 ){
            setSortedOptions(()=>{
                return options.toSorted((a,b) => {
                    if (a.friendlyName > b.friendlyName) return 1;
                    if (a.friendlyName < b.friendlyName) return -1;
                    return 0;
                })
            })
            setSortingReady(true);
            console.log("sorted")
        }
        if(selectedSorting === 1){
            setSortedOptions(()=>{
                return options.toSorted((a,b) => {
                    if (a.friendlyName > b.friendlyName) return -1;
                    if (a.friendlyName < b.friendlyName) return 1;
                    return 0;
                })
            })
            setSortingReady(true);
            console.log("sorted")
        }

    },[selectedSorting]);

    //delay sorting to select grid or list view. The list of sorted options is initially empty otherwise.
    useEffect(() => {
        setTimeout(()=>setSelectedSorting(0), 1000);
    },[])

    return (
        <>
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
            >
                <Tooltip
                    title={!clicked ? tooltip : "fetching available items"}
                >
                    <AnimatedButton
                        style={propsBorderRadius}
                        onClick={()=> {
                            setClicked(!clicked);
                            setOpen(true);
                        }}
                        loading={clicked}
                        disabled={options.length === 0}
                    >
                        < Add />
                    </AnimatedButton>
                </Tooltip>
                {(clicked) && <Tooltip title={""}>
                    <AnimatedButton
                        style={propsLeftExpand}
                        sx={{
                            justifyContent: 'flex-end'
                        }}
                        onClick={
                            () => {
                                setOpen(true);
                            }
                        }
                    >
                        {(clicked) && <ArrowDropDownIcon/>}
                    </AnimatedButton>
                </Tooltip>}
            </ButtonGroup>
            {(options.length !== 0) && (<Popper
                sx={{zIndex: 1}}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({TransitionProps, placement}) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        {
                            <Paper>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <Grid2
                                        container
                                        sx={{
                                            m: 1
                                        }}
                                    >
                                        <Grid2
                                            size={12}
                                        >
                                            <Stack
                                                direction="row"
                                            >
                                                <ButtonGroup
                                                    size="small"
                                                    sx={{
                                                        p: 1
                                                    }}
                                                >
                                                    <Tooltip title={"Sort alphabetically ascending"}>
                                                        <Button
                                                            variant={(selectedSorting === 0) ? "contained" : "outlined"}
                                                            onClick={() => {
                                                                setSortingReady(false);
                                                                setSelectedSorting(0);
                                                            }}
                                                        >
                                                            <SortByAlpha/>
                                                        </Button>
                                                    </Tooltip>

                                                    <Tooltip title={"Sort alphabetically descending"}>
                                                        <Button
                                                            variant={(selectedSorting === 1) ? "contained" : "outlined"}
                                                            onClick={() => {
                                                                setSortingReady(false);
                                                                setSelectedSorting(1);
                                                            }}
                                                        >
                                                            <SortByAlpha sx={{
                                                                transform: "scaleX(-1)"
                                                            }}/>
                                                        </Button>
                                                    </Tooltip>
                                                </ButtonGroup>
                                            </Stack>
                                        </Grid2>
                                        <MenuList
                                            id="split-button-menu"
                                            autoFocusItem
                                        >
                                            {
                                                (!sortingReady) && <CircularProgress/>
                                            }{  (sortingReady) && (
                                                (options.length >= 12) ? (
                                                    <Grid2
                                                        container
                                                        sx={{
                                                            m: 1,
                                                            maxWidth: 800,
                                                        }}
                                                    >
                                                        {
                                                            sortedOptions.map((item, index) => {
                                                                return (
                                                                    <Grid2
                                                                        size={2}
                                                                        sx={{
                                                                            p: 1,
                                                                            width: 200,
                                                                            ':hover': {
                                                                                bgcolor: 'rgba(255,255,255,0.08)',
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Tooltip
                                                                            title={`${item.friendlyName}${(item.unavailable) ? 'is not available' : ''}`}>
                                                                            <ButtonBase
                                                                                sx={{
                                                                                    width: '100%',
                                                                                    color: "text.primary",
                                                                                    textDecorationLine: (item.unavailable) ? "line-through" : "",
                                                                                }}
                                                                                onClick={
                                                                                    (item.unavailable) ? () => {
                                                                                    } : () => {
                                                                                        setSelectedIndex(index)
                                                                                    }

                                                                                }
                                                                                key={index}
                                                                            >
                                                                                <Typography
                                                                                    sx={{wordBreak: "break-word"}}
                                                                                    noWrap>
                                                                                    {item.friendlyName}
                                                                                </Typography>
                                                                            </ButtonBase>
                                                                        </Tooltip>
                                                                    </Grid2>
                                                                )
                                                            })
                                                        }
                                                    </Grid2>
                                                ) : (
                                                    sortedOptions.map((item, index) => (
                                                            <MenuItem
                                                                sx={{
                                                                    color: "text.primary",
                                                                    textDecorationLine: (item.unavailable) ? "line-through" : ""
                                                                }}
                                                                onClick={
                                                                    (item.unavailable) ? () => {
                                                                    } : () => {
                                                                        setSelectedIndex(index)
                                                                    }

                                                                }
                                                                key={index}
                                                            >
                                                                {(item.unavailable) ?
                                                                    <Tooltip title={"This item is not available"}>
                                                                        {item.friendlyName}
                                                                    </Tooltip> : item.friendlyName}
                                                            </MenuItem>
                                                        ))
                                                    )
                                                )
                                            }
                                        </MenuList>
                                    </Grid2>
                                </ClickAwayListener>
                            </Paper>
                        }
                    </Grow>
                )}
            </Popper>)}
        </>
    )
}
import {
    Avatar, Badge,
    Box, Button,
    Checkbox, Divider,
    IconButton,
    List,
    ListItem, ListItemAvatar, ListItemButton, ListItemIcon,
    ListItemText,
    Modal, Stack,
    Tooltip,
    Typography
} from "@mui/material";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import {Fragment, useEffect, useState} from "react";
import axios from "axios";
import ControlPointRoundedIcon from "@mui/icons-material/ControlPointRounded";
import modalStyles from "./ModalStyles.jsx";
import useCredentialStore from "../stores/CredentialStore.jsx";
import MemoItem from "./MemoItem.jsx";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import ModalHeader from "../base/ModalHeader.jsx";

function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

export default function Memo(
    {
        configurationID=0,
    }
) {
    // --- States ---
    const [memoModalActive, setMemoModalActive ] = useState(false);
    const [token] = useState(useCredentialStore.getState().token);
    const [items, setItems] = useState([]);
    const [memo, setMemo] = useState(
        {
            key: "",
            shared: false,
            referencedBy : [
                { resourceKey: "" }
            ],
            items: [
                {
                    itemID: "",
                    desc: "",
                    checked: false
                }
            ]
        }
    );
    // --- Handler ---
    const updateMemo = () => {
        if (!memo) return;

        axios.put(
            `/middleware/api/memo/${memo.key}/items`,
            {
                items: items
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }
        ).then((response) => {
        }).catch((error) => {
            console.error(error);
        })
    }

    const onNewItemClick = () => {
        if (!memo) return;

        const item = { desc: "New Memo/TODO", checked: false }

        axios.post(
            `/middleware/api/memo/${memo.key}/items`,
            {
                items: [ item ],
            },
            {
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            }
        ).then((response) => {
            const { resourceIDs } = response.data;
            item.itemID = resourceIDs[0];
            items.unshift(item);
            setItems(()=>[...items]);
        })
    }

    const onDeleteItemClick = (item) => {
        if (!memo) return;

        axios.delete(
            `/middleware/api/memo/${memo.key}/items`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                data: { items: [item] }
            }
        ).then((response) => {
            const index = items.findIndex((i) => i.itemID === item.itemID);
            if (index === -1) return;

            items.splice(index, 1);
            setItems(()=>[...items]);
        }).catch((error) => {
            console.error(error);
        })
    }
    // --- Effects ---
    // update
    useEffect(()=>{
        updateMemo();
    }, [items]);

    useEffect(() => {
        if (configurationID === 0) return;

        axios.get(
            `/middleware/api/configuration/${configurationID}/memo`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        ).then((response) => {
                const { memo } = response.data;
                const itemCollector = memo.items;
                setItems(()=>itemCollector);
                setMemo(()=>memo);
            }
        ).catch((error)=>{
            console.error(error);
        })
    }, [configurationID, memoModalActive]);

    return (
        <>
            <Badge badgeContent={items.filter((i) => i.checked === false).length} color="primary">
                <Button
                    variant="outlined"
                    size="small"
                    sx={{position: 'relative', top: -5, right: 0, }}
                    onClick={()=>{setMemoModalActive(()=>true)}}
                >
                    <Tooltip title={"Show Todos/Memos for this Configuration."}>
                        <ChecklistRtlIcon/>
                    </Tooltip>
                </Button>
            </Badge>
            <Modal
                open={memoModalActive}
                onClose={()=>{setMemoModalActive(false)}}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyles} className={"modal-box"}>
                    <ModalHeader>
                        Memos
                    </ModalHeader>
                    <Divider/>
                    <List id="modal-modal-description" sx={{ mt: 2 }}>
                        {
                            items.map((item, index) => {
                                const { desc, checked} = item;

                                return (
                                    <>
                                        <MemoItem
                                            key={`memo-item-${configurationID}-${index}`}
                                            checked={checked}
                                            setChecked={(next)=>{
                                                items[index].checked = next;
                                                setItems([...items]);
                                            }}
                                            item={ items[index] }
                                            onDeleteClick={onDeleteItemClick}
                                            onUpdate={(item)=>{
                                                const i = items.findIndex((it) => it.itemID === item.itemID);
                                                if (i === -1 ) return;

                                                items[i].desc = item.desc;
                                                console.log(items);

                                                setItems(()=>[...items]);
                                            }}
                                        />
                                        <Divider/>
                                    </>
                                )
                            })
                        }
                        <ListItem
                            alignItems={"flex-start"}
                        >
                            <ListItemButton onClick={onNewItemClick}>
                                <ListItemIcon>
                                    <ControlPointRoundedIcon color="primary" size={"large"}/>
                                </ListItemIcon>
                                <ListItemText primary="New Memo Item"/>
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Modal>
        </>

)
}

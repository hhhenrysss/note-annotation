import {
    Button,
    CircularProgress,
    Dialog,
    FormControl,
    FormControlLabel, FormLabel,
    IconButton, MenuItem, Radio, RadioGroup, Select, Switch,
    TextField
} from "@material-ui/core";
import {PDFViewer} from "./pdf-viewer";
import {useEffect, useState} from "react";
import {endpoints} from "../network/endpoints";
import {CommentDisplay, CommentMinimizedDisplay} from "./comment-display";
import {InfoOutlined, SettingsOutlined} from "@material-ui/icons";
import {blue} from "@material-ui/core/colors";
import {useHistory} from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';


function AppHeader({username, document, onUpdateDocument}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const history = useHistory();
    return (
        <>
            <div style={{background: 'black', width: '100%', display: 'flex', alignItems: 'center'}}>
                <h2 onClick={() => history.push('/pdfs')} style={{color: 'white', fontSize: 18, padding: '5px 15px', margin: 0, fontWeight: 500, cursor: "pointer"}}>Document
                    View</h2>
                <IconButton style={{marginLeft: 'auto'}} onClick={() => setIsDialogOpen(true)}><InfoOutlined
                    style={{color: 'white'}}/></IconButton>
                <Button style={{
                    color: '#fff1ff',
                    textTransform: 'none',
                    background: blue['700'],
                    height: '100%',
                    borderRadius: 0
                }} onClick={() => window.location.reload()}>{username}</Button>
            </div>
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DocumentInfo info={document} onUpdateInfo={onUpdateDocument}/>
            </Dialog>
        </>
    )
}

function DocumentInfo({info, onUpdateInfo}) {
    const [mode, setMode] = useState(null);
    const [documentName, setDocumentName] = useState(info.name);
    const onEdit = async () => {
        if (mode === 'edit') {
            const result = await endpoints.modifyDocument({name: documentName, id: info.id});
            if (result) {
                setMode(false);
                onUpdateInfo(result);
            }
        } else {
            setMode('edit');
        }
    }
    return (
        <div style={{padding: 15, width: 400}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <h1 style={{fontSize: 25, fontWeight: 500}}>Document Info</h1>
                <Button style={{marginLeft: 'auto'}} onClick={onEdit}>{mode === 'edit' ? 'Done' : 'Edit'}</Button>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <p style={{width: 150}}><strong>Document Name</strong></p>
                {mode === 'edit' ? <TextField value={documentName} onChange={e => setDocumentName(e.target.value)}/> :
                    <p>{documentName}</p>}
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <p style={{width: 150}}><strong>Author</strong></p>
                <p>{info.author}</p>
            </div>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <p style={{width: 150}}><strong>Creation Date</strong></p>
                <p>{new Date(info.creationDate).toLocaleDateString("en-US")}</p>
            </div>
        </div>
    )
}

const filterMode = Object.freeze({
    self: 'self',
    student: 'student',
    instructor: 'instructor'
})

function generateSelection(mode, highlights, users, currengUsername) {
    if (mode === filterMode.self) {
        return [highlights.filter(h => h.author === currengUsername), []];
    }
    const filteredHighlights = []
    const filteredUsers = new Set()
    for (const highlight of highlights) {
        const username = highlight.author
        if (username in users) {
            const role = users[username]
            if ((mode === filterMode.student && role === 'student') || (mode === filterMode.instructor && role === 'instructor')) {
                filteredHighlights.push(highlight)
                filteredUsers.add(username)
            }
        }
    }
    return [filteredHighlights, [...filteredUsers]]
}

export function DocumentViewer({username}) {
    const {selectedDoc, existingDocInfo} = useHistory().location.state
    const [document, setDocument] = useState(selectedDoc);
    const [values, setValues] = useState({});
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [highlightsFilter, setHighlightsFilter] = useState({author: '', mode: filterMode.self})
    const [selectedHighlight, setSelectedHighlight] = useState(null);
    const addHighlight = combined => {
        console.log('combined-addHighlight', combined)
        const time = Date.now()
        const comment = {
            id: `comment-${uuidv4().toString()}`,
            content: combined.comment.content,
            title: combined.comment.title,
            access: combined.comment.access,
            replies: [],
            author: username,
            linkedDocuments: combined.comment.links.map(l => l.id)
        }
        const highlight = {
            selectedText: combined.selectedText,
            position: combined.position,
            id: `highlight-${uuidv4().toString()}`,
            documentId: document.id,
            author: username,
            commentId: comment.id,
            upvotes: 0,
            access: comment.access
        }
        const externalLinks = [];
        for (const link of combined.comment.links) {
            if (link.isExternal) {
                externalLinks.push({
                    url: link.data.url,
                    name: link.name,
                    creationDate: time,
                    author: username,
                    id: link.id,
                    lastUpdatedDate: time
                })
            }
        }
        endpoints.addHighlight(highlight, comment, externalLinks).then(({highlight, comment, externalDocs}) => {
            setValues(old => {
                const newValue = {...old};
                newValue.highlights = [...newValue.highlights, highlight];
                newValue.comments = {...newValue.comments, [comment.id]: comment}
                newValue.linkedExternalResources = {...newValue.linkedExternalResources};
                for (const d of externalDocs) {
                    newValue.linkedExternalResources[d.id] = d
                }
                return newValue
            })
        })
    };
    const onUpvoteHighlight = shouldUpvote => {
        endpoints.upvoteHighlight(selectedHighlight.id, !shouldUpvote).then(h => {
            setValues(old => {
                const newValues = {...old};
                newValues.highlights = [...newValues.highlights];
                let i = 0;
                let isFound = false;
                for (; i < newValues.highlights.length; i += 1) {
                    if (newValues.highlights[i].id === h.id) {
                        isFound = true;
                        break;
                    }
                }
                if (isFound) {
                    newValues.highlights[i] = h;
                }
                return newValues
            })
            setSelectedHighlight(h)
        })
    }
    const onUpdateDocument = setDocument
    const onAddComment = (combined, targetId) => {
        console.log('combined-addComment', combined)
        const time = Date.now()
        const comment = {
            id: `comment-${uuidv4().toString()}`,
            content: combined.content,
            title: combined.title,
            access: combined.access,
            replies: [],
            author: username,
            linkedDocuments: combined.links.map(l => l.id)
        }
        const externalLinks = [];
        for (const link of combined.links) {
            if (link.isExternal) {
                externalLinks.push({
                    url: link.data.url,
                    name: link.name,
                    creationDate: time,
                    author: username,
                    id: link.id,
                    lastUpdatedDate: time
                })
            }
        }
        endpoints.addComment(targetId, comment, externalLinks).then(({comment, externalDocs}) => {
            setValues(old => {
                const newValue = {...old};
                newValue.comments = {...newValue.comments, [comment.id]: comment}
                newValue.comments[targetId].replies.push(comment.id)
                newValue.linkedExternalResources = {...newValue.linkedExternalResources};
                for (const d of externalDocs) {
                    newValue.linkedExternalResources[d.id] = d
                }
                return newValue
            })
        })
    }
    const onDeleteComment = id => {
        endpoints.deleteComment(id).then(() => setValues(old => {
            const newValues = {...old};
            newValues.comments = {...newValues.comments}
            delete newValues.comments[id]
            return newValues
        }))
    }
    useEffect(() => {
        if (!document) {
            return
        }
        console.log('selectedDocument', document)
        endpoints.getAllHighlights(document.id, username).then(val => {
            setSelectedHighlight(null)
            setValues(val);
        })
    }, [document])
    const [filteredHighlights, filteredUsers] = values.highlights ?
        generateSelection(highlightsFilter.mode, values.highlights, values.users, username) : [[], []]
    if (highlightsFilter.mode !== filterMode.self && highlightsFilter.author === '') {
        filteredHighlights.length = 0
    }
    return (
        <div style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column'}}>
            <AppHeader username={username} document={document} onUpdateDocument={setDocument}/>
            <div style={{display: 'flex', height: '100%'}}>
                {document ? (
                    <>
                        <PDFViewer existingDocInfo={existingDocInfo} username={username} highlights={filteredHighlights}
                                   url={document.url} onAddHighlight={addHighlight}/>
                        <div style={{
                            width: 'calc(40% - 1px)',
                            borderLeft: '1px solid gray',
                        }}>
                            <div style={{padding: 10, background: '#e1dfdd'}}>
                                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                    <h1 style={{fontSize: 25, fontWeight: 400, margin: 0}}>Highlights</h1>
                                    <IconButton style={{marginLeft: 'auto'}}
                                                onClick={() => setIsSettingOpen(s => !s)}><SettingsOutlined
                                        style={{color: 'black'}}/></IconButton>
                                </div>
                                {isSettingOpen && (
                                    <div style={{marginTop: 15}}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend">Filter Highlights by Type</FormLabel>
                                            <RadioGroup row={true} defaultValue={filterMode.self} aria-label="Filter Type" name="Filter Type" onChange={e => setHighlightsFilter({author: '', mode: e.target.value})}>
                                                <FormControlLabel value={filterMode.self} control={<Radio />} label={<div style={{fontSize: 12}}>{username}</div>} />
                                                <FormControlLabel value={filterMode.student} control={<Radio />} label={<div style={{fontSize: 12}}>Students</div>} />
                                                <FormControlLabel value={filterMode.instructor} control={<Radio />} label={<div style={{fontSize: 12}}>Instructors</div>} />
                                            </RadioGroup>
                                        </FormControl>
                                        {highlightsFilter.mode !== filterMode.self && (
                                            <Select fullWidth value={highlightsFilter.author} onChange={e => setHighlightsFilter(old => ({...old, author: e.target.value}))}>
                                                <MenuItem value=''>None</MenuItem>
                                                {filteredUsers.map(u => (
                                                    <MenuItem value={u}>{u}</MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{padding: 10}}>
                                {filteredHighlights.map(h => {
                                    const comment = values.comments[h.commentId]
                                    if (!comment) {
                                        return null
                                    }
                                    return (
                                        <CommentMinimizedDisplay
                                            key={h.id}
                                            username={comment.author}
                                            title={comment.title}
                                            content={comment.content}
                                            onClick={() => setSelectedHighlight(h)}
                                        />
                                    )
                                })}
                            </div>
                            {selectedHighlight && (
                                <Dialog PaperProps={{style: {background: "transparent", maxHeight: '70vh'}}} maxWidth={false} open={selectedHighlight != null} onClose={() => setSelectedHighlight(null)}>
                                    <CommentDisplay
                                        allComments={values.comments}
                                        allLinkedInternalDocs={values.linkedDocuments}
                                        allLinkedExternalDocs={values.linkedExternalResources}
                                        allUsers={values.users}
                                        highlight={selectedHighlight}
                                        onUpdateDocument={onUpdateDocument}
                                        onClickUpvote={onUpvoteHighlight}
                                        existingDocInfo={existingDocInfo}
                                        currentUsername={username}
                                        onAddComment={onAddComment}
                                        onDelete={onDeleteComment}
                                    />
                                </Dialog>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{display: 'flex', justifyContent: "center", alignItems: "center"}}>
                        <CircularProgress />
                    </div>
                )}
            </div>
        </div>
    )
}
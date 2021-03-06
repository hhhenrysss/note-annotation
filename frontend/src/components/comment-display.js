import {markdownConverter} from "../utils/markdown";
import {useState} from "react";
import {Add, Close, ThumbUp, ThumbUpOutlined} from "@material-ui/icons";
import {Button, Chip, IconButton} from "@material-ui/core";
import {useHistory} from "react-router-dom";
import {getHexGradient} from "../utils/color";
import {CommentTip} from "./comment-tip";
import {red} from "@material-ui/core/colors";

export function CommentMinimizedDisplay({title, username, content, onClick}) {
    return (
        <div className={'hover-card'} onClick={onClick} style={{padding: 10, borderBottom: '1px solid #c7c7c7', cursor: "pointer"}}>
            <h6 style={{fontSize: 15, margin: '5px 0'}}>{title}</h6>
            <p style={{fontSize: 12, color: 'gray', marginBottom: 5, margin: 0, padding: '5px 0'}}>{username}</p>
            <div style={{fontSize: 12, margin: 0, padding: 0}} dangerouslySetInnerHTML={{__html: markdownConverter.makeHtml(content)}}/>
        </div>
    )
}

function generateDocumentChips(comment, allLinkedInternalDocs, allLinkedExternalDocs, history, onUpdateDocument) {
    const chips = []
    if (!comment) {
        return []
    }
    for (const docId of comment.linkedDocuments) {
        if (docId in allLinkedInternalDocs) {
            const doc = allLinkedInternalDocs[docId]
            chips.push(<Chip
                style={{textOverflow: "ellipsis", maxWidth: 150}}
                label={doc.name}
                variant='outlined'
                color={'secondary'}
                key={docId}
                onClick={() => onUpdateDocument(doc)}
            />)
        } else if (docId in allLinkedExternalDocs) {
            const doc = allLinkedExternalDocs[docId]
            chips.push(<Chip
                style={{textOverflow: "ellipsis", maxWidth: 150}}
                label={doc.name}
                variant='outlined'
                color={'secondary'}
                key={docId}
                onClick={() => window.open(doc.url, '_blank')}
            />)
        }
    }
    return chips
}

function NestedReplies({commentId, allLinkedInternalDocs, allLinkedExternalDocs, allComments, allUsers, nestingLevel, onUpdateDocument, onClick, onDelete, currentUsername}) {
    const history = useHistory();
    const comment = allComments[commentId]
    const chips = generateDocumentChips(comment, allLinkedInternalDocs, allLinkedExternalDocs, history, onUpdateDocument)
    if (!comment) {
        return <></>
    }
    let shouldEnableDelete = false;
    if (comment.author in allUsers) {
        const authorRole = allUsers[comment.author]
        if (authorRole === 'instructor' || comment.author === currentUsername) {
            shouldEnableDelete = true;
        }
    }
    const onClickDelete = e => {
        e.stopPropagation()
        onDelete(comment.id)
    }
    return (
        <div>
            <div className={'hover-card'} style={{padding: 10, borderBottom: '1px solid lightgray', cursor: 'pointer'}} onClick={() => onClick(commentId)}>
                <div style={{display: "flex", alignItems: "center", marginBottom: 10}}>
                    <p style={{margin: 0, fontWeight: 500, fontSize: 12}}>{comment.author}</p>
                    {comment.author in allUsers && allUsers[comment.author] === 'instructor' && (
                        <div style={{marginLeft: '10px'}}>
                            <em style={{fontSize: 10, color: "gray"}}>Instructor</em>
                        </div>
                    )}

                    {shouldEnableDelete && (
                        <Button onClick={onClickDelete} style={{color: red['500'], marginLeft: "auto"}}>Delete</Button>
                    )}
                </div>
                <p style={{margin: 0, marginBottom: 10, fontSize: 12}}>{comment.content}</p>
                <div style={{display: 'flex', flexWrap: "wrap", gap: 10}}>
                    {chips}
                </div>
            </div>
            {comment.replies.length > 0 && (
                <div style={{marginLeft: (nestingLevel + 1) * 15, borderLeft: `2px solid ${getHexGradient('#ffffff', '#1976d2', (nestingLevel + 1)/10)}`}}>
                    {comment.replies.map(replyId => (
                        <NestedReplies
                            key={replyId}
                            commentId={replyId}
                            nestingLevel={nestingLevel + 1}
                            allComments={allComments}
                            allLinkedExternalDocs={allLinkedExternalDocs}
                            allLinkedInternalDocs={allLinkedInternalDocs}
                            allUsers={allUsers}
                            onUpdateDocument={onUpdateDocument}
                            onClick={onClick}
                            onDelete={onDelete}
                            currentUsername={currentUsername}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}



export function CommentDisplay({highlight, allLinkedInternalDocs, allLinkedExternalDocs, allComments, allUsers, onClickUpvote, onUpdateDocument, existingDocInfo, currentUsername, onAddComment, onDelete}) {
    const [isUpvoted, setIsUpvoted] = useState(false)
    const [clickedReply, setClickedReply] = useState(null)
    const history = useHistory();
    const selectedComment = allComments[highlight.commentId]
    console.log('selectedComment', selectedComment)
    const onThumbsUp = () => {
        setIsUpvoted(!isUpvoted);
        onClickUpvote(!isUpvoted);
    }
    let shouldEnableDelete = false;
    if (selectedComment && selectedComment.author in allUsers) {
        const authorRole = allUsers[selectedComment.author]
        if (authorRole === 'instructor' || selectedComment.author === currentUsername) {
            shouldEnableDelete = true;
        }
    }
    const chips = generateDocumentChips(selectedComment, allLinkedInternalDocs, allLinkedExternalDocs, history, onUpdateDocument)
    return (
        <div style={{overflowY: 'hidden', height: '100%', display: 'flex', maxWidth: clickedReply ? 'initial' : '600px', minWidth: '500px', background: "transparent"}}>
            <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '4px', overflowY: 'auto'}}>
                <div style={{display: 'flex', flexDirection: 'column', padding: 15}}>
                    <section>
                        <div style={{display: 'flex', alignItems: "center"}}>
                            <h2 style={{fontWeight: 500, fontSize: 20, margin: 0}}>Highlight</h2>
                            {(highlight.access === 'private' || selectedComment.access === 'private') && (
                                <p style={{margin: 0, marginLeft: 15, color: 'gray', fontSize: 12}}>private</p>
                            )}
                            <IconButton style={{marginLeft: 'auto'}} onClick={onThumbsUp}>
                                {isUpvoted ? <ThumbUp/> : <ThumbUpOutlined/>}
                            </IconButton>
                            {highlight.upvotes > 0 && (<span>{highlight.upvotes}</span>)}
                            {shouldEnableDelete && (
                                <Button onClick={() => onDelete(selectedComment.id)} style={{color: red['500']}}>Delete</Button>
                            )}
                        </div>
                        <div style={{display: "flex", alignItems: 'center'}}>
                            <p style={{margin: '5px 0'}}><span style={{fontSize: 14}}>{highlight.author}</span></p>
                            {selectedComment && selectedComment.author in allUsers && allUsers[selectedComment.author] === 'instructor' && (
                                <div style={{marginLeft: '10px'}}>
                                    <em style={{fontSize: 10, color: "gray"}}>Instructor</em>
                                </div>
                            )}
                        </div>
                        <blockquote style={{margin: 0, padding: 5, background: '#f3f2f1', borderLeft: '2px solid darkgray'}}>
                            <code style={{fontSize: 12}}>{highlight.selectedText.text}</code>
                        </blockquote>
                        <div>
                            <h3 style={{fontWeight: 500, fontSize: 14, margin: 0, padding: '5px 0', marginTop: 10, background: '#ffff00', display: 'inline-block'}}>{selectedComment.title}</h3>
                            <p style={{margin: 0, fontSize: 12}} dangerouslySetInnerHTML={{__html: markdownConverter.makeHtml(selectedComment.content)}}/>
                        </div>
                    </section>
                    <section>
                        <h2 style={{fontWeight: 500, fontSize: 20}}>Linked Documents</h2>
                        <div style={{display: 'flex', flexWrap: "wrap", gap: 10}}>
                            {chips}
                        </div>
                    </section>
                    <section>
                        <div style={{display: 'flex', alignItems: "center"}}>
                            <h2 style={{fontWeight: 500, fontSize: 20}}>Discussion</h2>
                            <IconButton style={{marginLeft: 'auto'}} onClick={() => setClickedReply(selectedComment.id)}><Add/></IconButton>
                        </div>

                        {selectedComment.replies.length > 0 && (
                            <>
                                {selectedComment.replies.map(replyId => (
                                    <NestedReplies
                                        key={replyId}
                                        commentId={replyId}
                                        nestingLevel={0}
                                        allComments={allComments}
                                        allLinkedExternalDocs={allLinkedExternalDocs}
                                        allLinkedInternalDocs={allLinkedInternalDocs}
                                        allUsers={allUsers}
                                        onUpdateDocument={onUpdateDocument}
                                        onClick={setClickedReply}
                                        onDelete={onDelete}
                                        currentUsername={currentUsername}
                                    />
                                ))}
                            </>
                        )}
                    </section>
                </div>
            </div>
            {clickedReply && (
                <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: 20, borderRadius: '4px', overflowY: 'auto'}}>
                    <CommentTip
                        hasTitle={false}
                        existingDocInfo={existingDocInfo}
                        username={currentUsername}
                        onAdd={data => {
                            onAddComment(data, clickedReply)
                            setClickedReply(false)
                        }}
                        onClose={() => setClickedReply(null)}
                    />
                </div>
            )}
        </div>
    )
}
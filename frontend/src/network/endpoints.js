import axios from 'axios';
import {Button} from "@material-ui/core";

function strip(result) {
    return result.data.data;
}

async function login(username, password) {
    const results = await axios.post('/api/login', {username, password});
    return strip(results);
}

async function register(username, password, role) {
    const results = await axios.post('/api/register', {username, password, role});
    return strip(results);
}

async function getDocuments(username) {
    const results = await axios.get('/api/pdfs', {params: {username}});
    return strip(results);
}

async function modifyDocument(data) {
    const results = await axios.post('/api/pdf/edit', data);
    return strip(results);
}

async function createDocument(doc) {
    const results = await axios.post('/api/pdf/create', doc);
    return strip(results);
}

async function deleteDocument(id) {
    const results = await axios.post('/api/pdf/delete', {id});
    return strip(results);
}

async function getAllHighlights(id, username) {
    const results = await axios.get('/api/highlights', {params: {id, username}});
    return strip(results)
}

async function addHighlight(highlight, comment, externalDocs) {
    const results = await axios.post('/api/highlight/add', {highlight, comment, externalDocs});
    return strip(results);
}

async function upvoteHighlight(id, isCancel) {
    const results = await axios.post('/api/highlight/upvote', {id, isCancel});
    return strip(results);
}

async function addComment(targetId, comment, externalDocs) {
    const results = await axios.post('/api/comment/add', {targetId, comment, externalDocs});
    return strip(results);
}

async function deleteComment(id) {
    const results = await axios.post('/api/comment/delete', {id});
    return strip(results);
}

export const endpoints = {login, register, getDocuments, modifyDocument, getAllHighlights, createDocument,
    addHighlight, upvoteHighlight, addComment, deleteDocument, deleteComment}
import React, { Component } from 'react';
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField} from '@mui/material';
import { Link } from 'react-router-dom';
import './userPhotos.css';
import axios from 'axios';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';

class UserPhotos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      user: null,
      comment: null,
      loggedInUserId: props.loggedInUserId,
      newComment: '',
      addComment: false,
      currentPhotoId: null,
    };

    this.handleShowAddComment = this.handleShowAddComment.bind(this);
    this.handleNewCommentChange = this.handleNewCommentChange.bind(this);
    this.handleCancelAddComment = this.handleCancelAddComment.bind(this);
    this.handleSubmitAddComment = this.handleSubmitAddComment.bind(this);
    this.handleLikePhoto = this.handleLikePhoto.bind(this);
  }

  async handleLikePhoto(photoId) {
    try {
      const response = await axios.put(`/likephoto/${photoId}`);
      console.log(response.data.message);
  
      const updatedPhotos = this.state.photos.map((photo) => {
        if (photo._id === photoId) {
          const isLiked = photo?.likes?.some((like) => like.user_id === this.state.loggedInUserId);
          const numLikes = isLiked ? photo.num_likes - 1 : photo.num_likes + 1;
          const likes = isLiked
            ? photo.likes.filter((like) => like.user_id !== this.state.loggedInUserId)
            : [...photo.likes, { user_id: this.state.loggedInUserId }];
  
          return { ...photo, num_likes: numLikes, likes };
        }
        return photo;
      });
  
      this.setState({ photos: updatedPhotos });
    } catch (error) {
      console.error('Error liking/unliking photo:', error);
    }
  }

  

  async fetchUserPhotosAndDetails() {
    const { userId } = this.props.match.params;

    try {
      const photosResponse = await axios.get(`/photosOfUser/${userId}?currentLoggedUserId=${this.state.loggedInUserId}`);
      this.setState({ photos: photosResponse.data });

      const userDetailsResponse = await axios.get(`/user/${userId}`);
      if (userDetailsResponse.data) {
        const userDetails = userDetailsResponse.data;
        this.setState({
          user: userDetails,
          comment: userDetails.comment,
        });
        this.props.labelOnTopBar(`Photos of: ${userDetails.first_name} ${userDetails.last_name}`);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  handleShowAddComment(photoId) {
    this.setState({
      addComment: true,
      currentPhotoId: photoId,
    });
  }

  handleNewCommentChange(event) {
    this.setState({
      newComment: event.target.value,
    });
  }

  handleCancelAddComment() {
    this.setState({
      addComment: false,
      newComment: '',
      currentPhotoId: null,
    });
  }

  async handleSubmitAddComment() {
    const { currentPhotoId, newComment } = this.state;

    try {
      await axios.post(`/commentsOfPhoto/${currentPhotoId}`, { comment: newComment });
      console.log('Comment added successfully');
      this.setState({
        addComment: false,
        newComment: '',
        currentPhotoId: null,
      });
      this.fetchUserPhotosAndDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  componentDidMount() {
    this.fetchUserPhotosAndDetails();
  }

  componentDidUpdate(prevProps) {
    const { userId } = this.props.match.params;
    if (prevProps.match.params.userId !== userId) {
      this.fetchUserPhotosAndDetails();
    }
  }

  async handleDeleteCommentById(commentId) {
    console.log("Delete comment by id clicked", commentId);
    try {
      const body = { commentId: commentId };
      await axios.delete("/deletecommentbyid", { data: body })
        .then(response => {
          console.log("Comment deleted successfully");
          console.log(response.data);
          this.fetchUserPhotosAndDetails();
        })
        .catch(error => {
          console.error("Unable to delete comment by id: ", error);
        });
    } catch (error) {
      console.error("Unable to delete comment by id: ", error);
    }
  }
  
  async handleDeletePhotoById(photoId) {
    console.log("delete photo by id: ", photoId);
    try {
      const body = { photoId: photoId };
      await axios.delete("/deletephotobyid", { data: body })
        .then(response => {
          console.log("Photo deleted successfully");
          console.log(response.data);
          this.fetchUserPhotosAndDetails();
        })
        .catch(error => {
          console.error("Unable to delete photo by id: ", error);
        });
    } catch (error) {
      console.error("Unable to delete photo by id: ", error);
    }
  }

  render() {
    const { photos, user, comment, addComment, newComment } = this.state;
    console.log("current logged in user: ",this.state.loggedInUserId);
    return (
      <div>
        <Button
          component={Link}
          to={`/users/${this.props.match.params.userId}`}
          variant="contained"
          className="ButtonLink"
        >
          User Details
        </Button>

        <Typography variant="h4" className="UserPhotosHeader">
          User Photos
        </Typography>

        <div className="photo-list photo-image">
          {photos.map((photo) => (
            <div key={photo._id} className="photo-comment-container">
              <img
                src={`/images/${photo.file_name}`}
                alt={`User's pic is not available`}
                className="photo-image"
              />
              <div className="like-button">
                {photo.likes.some((like) => like.user_id === this.state.loggedInUserId) ? (
                  <ThumbUpIcon
                    onClick={() => this.handleLikePhoto(photo._id)}
                    color="primary"
                  />
                ) : (
                  <ThumbUpOutlinedIcon
                    onClick={() => this.handleLikePhoto(photo._id)}
                    color="action"
                  />
                )}
                <span>{photo.num_likes} Likes</span>
              </div>

             {photo.user_id === this.state.loggedInUserId && (
              <Button variant="contained" color="secondary" onClick={()=> this.handleDeletePhotoById(photo._id)}>
                Delete Photo
              </Button>
             )}


              {photo.comments && photo.comments.length > 0 && (
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Comments:</p>
                  {photo.comments.map((photoComment) => (
                    <div key={photoComment._id} className="photo-comment-container" style={{ marginTop: '16px' }}>
                      <p>{photoComment.comment}</p>
                      <p>
                        <b>Commented ON:</b> {photoComment.date_time}
                      </p>
                      <p>
                        <b>Commented BY:</b>
                        <Link to={`/users/${photoComment.user._id}`}>
                          {photoComment.user.first_name} {photoComment.user.last_name}
                        </Link>
                      </p>
                      {/* Delete Comment Button */}
                    {/* <h1>comment id : {photoComment._id}Photo commented user id: {photoComment.user_id} logged: {this.state.loggedInUserId}</h1> */}
                    {photoComment.user_id === this.state.loggedInUserId && (
                      <Button variant="contained" color="secondary" onClick={()=>this.handleDeleteCommentById(photoComment._id)}>
                        Delete Comment
                      </Button>
                    )}
                    </div>
                  ))}
                </div>
              )}
              {/* Add Comment Button */}
              <Button variant="contained" onClick={() => this.handleShowAddComment(photo._id)}>
                Add Comment
              </Button>
            </div>
          ))}
        </div>

        {/* Render User Comment */}
        {user && comment && (
          <div className="user-photo-box" style={{ marginTop: '16px' }}>
            <Typography variant="caption" className="user-photo-title">
              Comment
            </Typography>
            <Typography variant="body1" className="user-photo-value">
              {comment}
            </Typography>
          </div>
        )}

        {/* Render Add Comment Dialog */}
        <Dialog open={addComment}>
          <DialogTitle>Add Comment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter a new comment for the photo.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="comment"
              label="Comment"
              multiline
              rows={4}
              fullWidth
              variant="standard"
              onChange={this.handleNewCommentChange}
              value={newComment}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCancelAddComment}>Cancel</Button>
            <Button onClick={this.handleSubmitAddComment}>Add</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default UserPhotos;

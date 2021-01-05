import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';

import ImagePicker from 'react-native-image-picker';

import { currentUser, listenToMessages, createMessage, markThreadLastRead, getImageURL, uploadImage } from '../firebase';

export default class Messages extends React.Component {
  state = {
    messages: [],
    image: false,
  };

  componentDidMount() {
    const thread = this.props.navigation.getParam('thread');
    this.removeMessagesListener = listenToMessages(thread._id)
      .onSnapshot(querySnapshot => {
        const messages = querySnapshot.docs.map(doc => {
          const firebaseData = doc.data();
          const data = {
            _id: doc.id,
            text: '',
            image: '',
            createdAt: new Date().getTime(),
            ...firebaseData,
          };
          if (!firebaseData.system) {
            data.user = {
              ...firebaseData.user,
              name: firebaseData.user.displayName,
            };
          }
          return data;
        });
        this.setState({ messages });
      })
  }

  componentWillUnmount() {
    const thread = this.props.navigation.getParam('thread');
    markThreadLastRead(thread._id);
    if (this.removeMessagesListener) {
      this.removeMessagesListener();
    }
  }

  handleSend = messages => {
    const text = messages[0].text;
    const thread = this.props.navigation.getParam('thread');
    return createMessage(thread._id, text);
  };

  generateUniqueID = (userID) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result + userID;
  }

  uploadImage = (userID, thread) => {
    const options = {
      noData: true
    };
    ImagePicker.showImagePicker(options, (response) => {
      if (response.uri) {
        const uniqueID = this.generateUniqueID(userID);
        this.setState({ image: true });
        return uploadImage(response.uri, uniqueID, thread._id)
          .then(() => getImageURL(uniqueID, thread._id))
          .then((imageURL) => createMessage(thread._id, '', imageURL, this.state.image))
          .then(() => this.setState({ image: false }))
          .catch((err) => console.log(err));
      };
    });
  }

  render() {
    const user = currentUser();

    return (
      <GiftedChat
        renderActions={() => {
          return (
            <TouchableOpacity onPress={() => this.uploadImage(user.uid, this.props.navigation.getParam('thread'))}>
              <Image source={require('../assets/icons/add.png')} />
            </TouchableOpacity>
          )
        }}
        messages={this.state.messages}
        onSend={this.handleSend}
        user={{
          _id: user.uid,
        }}
      />
    );
  }
}
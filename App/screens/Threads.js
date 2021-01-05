import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ThreadRow, Separator } from '../components/ThreadRow';
import { deleteThread, listenToThreads, listenToThreadTracking } from '../firebase'

const styles = StyleSheet.create({
  rightAction: {
    backgroundColor: '#FF0000',
    borderRadius: 4,
    justifyContent: "center"

  },
  textAction: {
    fontWeight: '600',
    fontSize: 18,
    color: '#000',

  }
});

export default class Threads extends React.Component {
  state = {
    threads: [],
    threadTracking: ''
  };

  componentDidMount() {
    this.removeThreadListener = listenToThreads()
      .onSnapshot(querySnapshot => {
        const threads = querySnapshot.docs.map(doc => {
          return {
            _id: doc.id,
            name: '',
            latestMessage: { text: '' },
            ...doc.data()
          }
        });

        this.setState({ threads });
      });
    this.removeThreadListener = listenToThreadTracking()
      .onSnapshot(querySnapshot => {
        this.setState({ threadTracking: querySnapshot.data() || {} })
      })
  }

  componentWillUnmount() {
    if (this.removeThreadListener) {
      this.removeThreadListener();
    }
    if (this.removeThreadListener) {
      this.removeThreadListener();
    }
  }

  isThreadUnread = (thread) => {
    const { threadTracking } = this.state;
    if (!threadTracking[thread._id] || threadTracking[thread._id].lastRead < thread.latestMessage.createdAt) {
      return true;
    }
    return false;
  }

  rightAction = () => (
    <View style={styles.rightAction}>
      <Text style={styles.textAction}>Delete</Text>
    </View>
  )

  render() {
    return (
      <FlatList
        data={this.state.threads}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={this.rightAction}
            onSwipeableRightOpen={() => deleteThread(item._id)}
          >
            <ThreadRow
              {...item}
              onPress={() =>
                this.props.navigation.navigate('Messages', { thread: item })
              }
              unread={this.isThreadUnread(item)}
            />
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <Separator />}
      />
    );
  }
}

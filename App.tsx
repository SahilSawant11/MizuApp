import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { initDatabase } from './src/database/db';

function App() {
  useEffect(() => {
    initDatabase()
      .then(() => console.log('✅ Database ready'))
      .catch(err => console.error('❌ DB init failed:', err));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Daylog App</Text>
    </View>
  );
}

export default App;
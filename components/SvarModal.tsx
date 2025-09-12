// components/SvarModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SvarModal({ visible, onClose, onSend }) {
  const [svar, setSvar] = useState('');

  // Ryd feltet hver gang dialog åbner
  useEffect(() => {
    if (visible) setSvar('');
  }, [visible]);

  const handleSend = () => {
    if (svar.trim() !== '') {
      onSend(svar);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Skriv dit svar</Text>
          <TextInput
            style={styles.input}
            placeholder="Skriv dit svar her..."
            value={svar}
            onChangeText={setSvar}
            multiline
          />
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.btnText}>Annuller</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend}>
              <Text style={[styles.btnText, { color: '#254890' }]}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  box: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16
  },
  input: {
    backgroundColor: '#f0f0f0',
    minHeight: 60,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 18,
    textAlignVertical: 'top'
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 16
  }
});

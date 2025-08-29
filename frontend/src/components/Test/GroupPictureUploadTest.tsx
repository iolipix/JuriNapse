import React, { useState } from 'react';
import { useMessaging } from '../../contexts/MessagingContext';

const GroupPictureUploadTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');
  
  const { updateGroupPicture } = useMessaging();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setMessage('');
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('❌ Veuillez sélectionner une image');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage('❌ L\'image ne doit pas dépasser 5MB');
      return;
    }
    
    if (!selectedFile.type.startsWith('image/')) {
      setMessage('❌ Veuillez sélectionner une image valide');
      return;
    }
    
    setUploading(true);
    setMessage('⏳ Upload en cours...');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          
          // TEST: Utiliser un ID de groupe fictif pour tester
          const testGroupId = 'test-group-id';
          await updateGroupPicture(testGroupId, base64);
          
          setMessage('✅ Photo de groupe mise à jour avec succès !');
          setSelectedFile(null);
          
          // Réinitialiser le champ file
          const input = document.getElementById('test-file-input') as HTMLInputElement;
          if (input) input.value = '';
          
        } catch (error) {
          console.error('Erreur upload:', error);
          setMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Erreur lecture fichier:', error);
      setMessage('❌ Erreur lors de la lecture du fichier');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #e5e5e5', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 Test d'Upload de Photo de Groupe</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          id="test-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      
      {selectedFile && (
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          📁 Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{
          padding: '10px 20px',
          backgroundColor: uploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? '⏳ Upload...' : '📤 Upload Photo'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        <strong>Instructions:</strong>
        <ul>
          <li>Sélectionnez une image (PNG, JPEG, etc.)</li>
          <li>Taille max: 5MB</li>
          <li>Cliquez sur "Upload Photo" pour tester</li>
          <li>Vérifiez la console du navigateur pour plus de détails</li>
        </ul>
      </div>
    </div>
  );
};

export default GroupPictureUploadTest;

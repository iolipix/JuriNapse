import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Users, BookOpen, Upload, File, Lock, Globe, Scroll, Search, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { PostType } from '../../types';
import { usePost } from '../../contexts';
import { judilibreAPI } from '../../services/judilibre';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string; // Ajout du paramètre folderId optionnel
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, folderId }) => {
  const { createPost, posts } = usePost();
  const [formData, setFormData] = useState({
    type: 'discussion' as PostType,
    title: '',
    content: '',
    tags: [] as string[],
    isPrivate: false,
    decisionNumber: '', // Nouveau champ pour les fiches d'arrêt
    jurisdiction: '', // Nouveau champ obligatoire pour les fiches d'arrêt
  });
  const [tagInput, setTagInput] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [decisionSuggestions, setDecisionSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // États pour l'intégration Judilibre
  const [isEnrichingFromJudilibre, setIsEnrichingFromJudilibre] = useState(false);
  const [judilibreEnrichmentResult, setJudilibreEnrichmentResult] = useState<any>(null);
  const [judilibreError, setJudilibreError] = useState<string | null>(null);
  const [showJudilibreSuccess, setShowJudilibreSuccess] = useState(false);

  // Fonction pour vérifier si l'utilisateur a commencé à écrire
  const hasContent = () => {
    return formData.title.trim() !== '' || 
           formData.content.trim() !== '' || 
           formData.tags.length > 0 || 
           formData.decisionNumber.trim() !== '' ||
           formData.jurisdiction.trim() !== '' ||
           pdfFile !== null;
  };

  // Fonction pour gérer la fermeture avec avertissement
  const handleClose = () => {
    if (hasContent()) {
      const confirmed = window.confirm(
        'Vous avez du contenu non sauvegardé. Êtes-vous sûr de vouloir fermer cette publication ?'
      );
      if (confirmed) {
        resetForm();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      type: 'discussion',
      title: '',
      content: '',
      tags: [],
      isPrivate: false,
      decisionNumber: '',
      jurisdiction: '',
    });
    setTagInput('');
    setPdfFile(null);
    setShowSuggestions(false);
    
    // Reset Judilibre
    setJudilibreEnrichmentResult(null);
    setJudilibreError(null);
    setShowJudilibreSuccess(false);
    setIsEnrichingFromJudilibre(false);
  };

  // Enrichir automatiquement depuis Judilibre
  const handleEnrichFromJudilibre = async () => {
    if (!formData.decisionNumber.trim() || !formData.jurisdiction.trim()) {
      setJudilibreError('Veuillez saisir un numéro de décision et sélectionner une juridiction');
      return;
    }

    try {
      setIsEnrichingFromJudilibre(true);
      setJudilibreError(null);
      
      const result = await judilibreAPI.enrichDecision(formData.decisionNumber, formData.jurisdiction);
      
      if (result.success && result.data) {
        const enrichedData = result.data;
        
        // Pré-remplir le formulaire avec les données enrichies
        setFormData(prev => ({
          ...prev,
          title: enrichedData.summary || prev.title,
          content: enrichedData.fullText || prev.content,
          decisionNumber: enrichedData.decisionNumber || prev.decisionNumber,
          jurisdiction: enrichedData.jurisdiction || prev.jurisdiction
        }));
        
        setJudilibreEnrichmentResult(result);
        setShowJudilibreSuccess(true);
        
        // Masquer le message de succès après 5 secondes
        setTimeout(() => setShowJudilibreSuccess(false), 5000);
        
      } else {
        setJudilibreError(result.error || 'Erreur lors de l\'enrichissement');
      }
    } catch (error: any) {
      setJudilibreError(error.message || 'Erreur de connexion avec Judilibre');
    } finally {
      setIsEnrichingFromJudilibre(false);
    }
  };

  // Gérer le clic à l'extérieur du modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, formData, pdfFile]);

  if (!isOpen) return null;

  const postTypes = [
    { id: 'fiche-arret', label: 'Fiche d\'arrêt', icon: FileText, description: 'Analyse d\'une décision de justice' },
    { id: 'discussion', label: 'Publication', icon: Users, description: 'Conseil, question ou discussion générale' },
    { id: 'cours', label: 'Cours', icon: BookOpen, description: 'Partager un cours en format PDF' },
    { id: 'protocole', label: 'Protocole', icon: Scroll, description: 'Partagez vos majeures' },
  ];

  // Fonction pour obtenir les suggestions de numéros de décision
  const getDecisionSuggestions = (query: string) => {
    if (!query.trim()) return [];
    
    const existingDecisions = posts
      .filter(p => p.type === 'fiche-arret' && p.decisionNumber)
      .map(p => p.decisionNumber!)
      .filter((decision, index, arr) => arr.indexOf(decision) === index) // Supprimer les doublons
      .filter(decision => decision.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5); // Limiter à 5 suggestions

    return existingDecisions;
  };

  const handleDecisionNumberChange = (value: string) => {
    setFormData(prev => ({ ...prev, decisionNumber: value }));
    
    if (value.trim().length > 0) {
      const suggestions = getDecisionSuggestions(value);
      setDecisionSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, decisionNumber: suggestion }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pour les fiches d'arrêt, vérifier que la juridiction est renseignée
    if (formData.type === 'fiche-arret' && !formData.jurisdiction.trim()) {
      alert('La juridiction est obligatoire pour les fiches d\'arrêt.');
      return;
    }
    
    // Pour les posts PDF, vérifier qu'un fichier est sélectionné
    if (formData.type === 'cours' && !pdfFile) {
      alert('Veuillez sélectionner un fichier PDF pour ce type de publication.');
      return;
    }
    
    let pdfData = null;
    if (pdfFile && formData.type === 'cours') {
      // Convertir le fichier en base64 pour le stockage local
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfFile);
      });
      
      const base64Data = await base64Promise;
      pdfData = {
        name: pdfFile.name,
        url: base64Data,
        size: pdfFile.size,
      };
    }

    // Pour les posts PDF, utiliser le nom du fichier comme titre par défaut si pas de titre
    const finalTitle = formData.type === 'cours' && !formData.title.trim() && pdfFile 
      ? pdfFile.name.replace('.pdf', '') 
      : formData.title;

    // Pour les posts PDF, utiliser une description par défaut si pas de contenu
    const finalContent = formData.type === 'cours' && !formData.content.trim() 
      ? `Cours PDF partagé : ${pdfFile?.name || 'Document'}`
      : formData.content;

    createPost({
      ...formData,
      title: finalTitle,
      content: finalContent,
      pdfFile: pdfData || undefined,
      folderId: folderId || undefined, // Ajout du folderId si fourni
      savesCount: 0,
    });
    
    resetForm();
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 3) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) { // 10MB max
      setPdfFile(file);
    } else {
      alert('Veuillez sélectionner un fichier PDF de moins de 10MB');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    if (formData.type === 'cours') {
      // Pour les cours PDF, seul le fichier est obligatoire
      return pdfFile !== null;
    } else {
      // Pour les autres types, titre et contenu sont obligatoires
      return formData.title.trim() && formData.content.trim();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        // Sauvegarder si le mousedown est sur le backdrop
        if (e.target === e.currentTarget) {
          (e.currentTarget as any)._mouseDownOnBackdrop = true;
        }
      }}
      onClick={(e) => {
        // Ne fermer que si mousedown ET click sont sur le backdrop
        if (e.target === e.currentTarget && (e.currentTarget as any)._mouseDownOnBackdrop) {
          handleClose();
        }
        // Nettoyer le flag
        (e.currentTarget as any)._mouseDownOnBackdrop = false;
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Créer une publication</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de publication
            </label>
            <div className="grid grid-cols-1 gap-3">
              {postTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.id;
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        type: type.id as PostType,
                        decisionNumber: type.id === 'fiche-arret' ? prev.decisionNumber : '',
                        jurisdiction: type.id === 'fiche-arret' ? prev.jurisdiction : ''
                      }));
                      if (type.id !== 'cours') {
                        setPdfFile(null);
                      }
                      setShowSuggestions(false);
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {type.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibilité
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all ${
                  !formData.isPrivate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <Globe className={`h-5 w-5 ${!formData.isPrivate ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${!formData.isPrivate ? 'text-blue-900' : 'text-gray-900'}`}>
                    Public
                  </p>
                  <p className="text-sm text-gray-600">Visible par tous</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all ${
                  formData.isPrivate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <Lock className={`h-5 w-5 ${formData.isPrivate ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <p className={`font-medium ${formData.isPrivate ? 'text-blue-900' : 'text-gray-900'}`}>
                    Privé
                  </p>
                  <p className="text-sm text-gray-600">Visible seulement par vous</p>
                </div>
              </button>
            </div>
          </div>

          {/* PDF Upload for cours type */}
          {formData.type === 'cours' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier PDF du cours <span className="text-red-500">*</span>
              </label>
              {!pdfFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Glissez-déposez votre PDF ici
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    ou cliquez pour sélectionner un fichier
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Sélectionner un PDF
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Taille maximale : 10MB
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <File className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{pdfFile.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(pdfFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Avertissement propriété intellectuelle pour les cours */}
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Scroll className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-1">
                      Rappel sur la propriété intellectuelle
                    </p>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      Assurez-vous d'avoir les droits nécessaires pour partager ce contenu. 
                      Le partage de cours protégés par le droit d'auteur sans autorisation peut constituer une violation de la propriété intellectuelle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre {formData.type !== 'cours' && <span className="text-red-500">*</span>}
              {formData.type === 'cours' && <span className="text-gray-500 text-xs">(optionnel - nom du fichier utilisé par défaut)</span>}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={
                formData.type === 'cours' 
                  ? "Titre du cours (ex: Droit des contrats - Chapitre 1)"
                  : formData.type === 'fiche-arret'
                  ? "Titre de la fiche d'arrêt (ex: Arrêt Chronopost - Clause limitative de responsabilité)"
                  : "Un titre accrocheur pour votre publication..."
              }
              required={formData.type !== 'cours'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Juridiction pour les fiches d'arrêt */}
          {formData.type === 'fiche-arret' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Juridiction <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.jurisdiction}
                onChange={(e) => setFormData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une juridiction</option>
                <option value="Cour de cassation">Cour de cassation</option>
                <option value="Conseil d'État">Conseil d'État</option>
                <option value="Autre">Autre (saisie libre)</option>
              </select>
              
              {/* Champ libre si "Autre" est sélectionné */}
              {formData.jurisdiction === 'Autre' && (
                <input
                  type="text"
                  placeholder="Précisez la juridiction..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setFormData(prev => ({ ...prev, jurisdiction: e.target.value || 'Autre' }))}
                />
              )}
            </div>
          )}

          {/* Numéro de décision pour les fiches d'arrêt avec enrichissement Judilibre */}
          {formData.type === 'fiche-arret' && (
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de la décision <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.decisionNumber}
                    onChange={(e) => handleDecisionNumberChange(e.target.value)}
                    onFocus={() => {
                      if (formData.decisionNumber.trim()) {
                        const suggestions = getDecisionSuggestions(formData.decisionNumber);
                        setDecisionSuggestions(suggestions);
                        setShowSuggestions(suggestions.length > 0);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Ex: 23-12.120"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {/* Bouton d'enrichissement Judilibre */}
                  {(formData.jurisdiction === 'Cour de cassation' || formData.jurisdiction === 'Conseil d\'État') && (
                    <button
                      type="button"
                      onClick={handleEnrichFromJudilibre}
                      disabled={isEnrichingFromJudilibre || !formData.decisionNumber.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {isEnrichingFromJudilibre ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {isEnrichingFromJudilibre ? 'Recherche...' : 'Auto-remplir'}
                    </button>
                  )}
                </div>
                
                {/* Messages d'état Judilibre */}
                {judilibreError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {judilibreError}
                  </div>
                )}
                
                {showJudilibreSuccess && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Décision trouvée et données pré-remplies !
                    {judilibreEnrichmentResult?.enrichedData?.savedFile && (
                      <button
                        type="button"
                        onClick={() => judilibreAPI.downloadDecision(judilibreEnrichmentResult.enrichedData.savedFile)}
                        className="ml-2 flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-3 h-3" />
                        Télécharger le texte complet
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Suggestions dropdown */}
              {showSuggestions && decisionSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto z-50">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs text-gray-600 font-medium">Décisions existantes :</p>
                  </div>
                  {decisionSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Ce numéro permettra de regrouper toutes les fiches d'arrêt sur cette décision
              </p>
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type === 'cours' ? 'Description du cours' : 'Contenu'} 
              {formData.type !== 'cours' && <span className="text-red-500">*</span>}
              {formData.type === 'cours' && <span className="text-gray-500 text-xs">(optionnel)</span>}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={`${
                formData.type === 'fiche-arret' 
                  ? 'Structurez votre fiche : Faits, Procédure, Problème de droit, Solution, Portée...'
                  : formData.type === 'cours'
                  ? 'Décrivez le contenu du cours, les chapitres abordés, le niveau requis...'
                  : formData.type === 'protocole'
                  ? 'Partagez vos majeures'
                  : 'Partagez vos idées et lancez la discussion...'
              }`}
              required={formData.type !== 'cours'}
              rows={formData.type === 'cours' ? 6 : 8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Utilisez **texte** pour mettre en gras et structurer votre contenu.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mots-clés <span className="text-gray-500 text-xs">(maximum 3)</span>
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  formData.type === 'cours' 
                    ? "Ex: L1, contrats, civil..."
                    : formData.type === 'fiche-arret'
                    ? "Ex: responsabilité, contrats, chronopost..."
                    : "Ajouter un mot-clé..."
                }
                disabled={formData.tags.length >= 3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={formData.tags.length >= 3 || !tagInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.tags.length}/3 mots-clés utilisés
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {formData.type === 'cours' && !pdfFile ? 'Sélectionnez un PDF' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
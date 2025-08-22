import React, { useState, useEffect } from 'react';
import { useMessaging } from '../../contexts';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface GroupModerationPanelProps {
  groupId: string;
  onClose: () => void;
}

const GroupModerationPanel: React.FC<GroupModerationPanelProps> = ({ groupId, onClose }) => {
  const { user } = useAuth();
  const { 
    groups,
    promoteModerator, 
    demoteModerator, 
    kickMember, 
    updateGroupPicture,
    updateGroup,
    isGroupAdmin,
    isGroupModerator 
  } = useMessaging();
  
  // Récupérer le groupe depuis le contexte pour avoir toujours les dernières données
  const group = groups.find(g => g.id === groupId);
  
  // Si le groupe n'existe pas, fermer le modal
  useEffect(() => {
    if (!group) {
      onClose();
    }
  }, [group, onClose]);
  
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [groupDescription, setGroupDescription] = useState(group?.description || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Mettre à jour les états locaux quand le groupe change
  useEffect(() => {
    if (group) {
      setGroupName(group?.name || '');
      setGroupDescription(group?.description || '');
    }
  }, [group]);

  if (!group) {
    return null;
  }

  const isAdmin = isGroupAdmin(groupId);
  const isModerator = isGroupModerator(groupId);
  const canModerate = isAdmin || isModerator;

  // Logs de debug temporaires

  if (!canModerate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h2 className="text-xl font-bold mb-4">Accès refusé</h2>
          <p className="text-gray-600 mb-4">Vous n'avez pas les permissions pour modérer ce groupe.</p>
          <button 
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const handlePromoteModerator = async (userId: string) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await promoteModerator(groupId, userId);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteModerator = async (userId: string) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await demoteModerator(groupId, userId);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleKickMember = async (userId: string) => {
    if (!canModerate) return;
    
    // Empêcher les modérateurs d'exclure l'admin ou d'autres modérateurs
    if (!isAdmin && (userId === group?.adminId || group?.moderatorIds.includes(userId))) {
      alert('Vous ne pouvez pas exclure un administrateur ou un autre modérateur.');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir exclure ce membre du groupe ?')) {
      setLoading(true);
      try {
        await kickMember(groupId, userId);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        // Uploader l'image vers le backend
        await uploadGroupPicture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadGroupPicture = async (imageData: string) => {
    setLoading(true);
    try {
      await updateGroupPicture(groupId, imageData);
      
      // Réinitialiser l'input file
      const input = document.getElementById('groupPictureInput') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    } catch (error) {
      alert('Erreur lors de la mise à jour de l\'image du groupe');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!groupName.trim() || groupName === group.name) {
      setIsEditingName(false);
      setGroupName(group.name);
      return;
    }
    
    setLoading(true);
    try {
      await updateGroup(groupId, groupName.trim(), groupDescription);
      setIsEditingName(false);
    } catch (error) {
      setGroupName(group.name);
      setIsEditingName(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroupDescription = async () => {
    if (groupDescription === group.description) {
      setIsEditingDescription(false);
      return;
    }
    
    setLoading(true);
    try {
      await updateGroup(groupId, groupName, groupDescription);
      setIsEditingDescription(false);
    } catch (error) {
      setGroupDescription(group.description || '');
      setIsEditingDescription(false);
    } finally {
      setLoading(false);
    }
  };

  const getMemberRole = (member: User) => {
    if (member.id === group?.adminId) return 'Administrateur';
    if (group?.moderatorIds.includes(member.id)) return 'Modérateur';
    return 'Membre';
  };

  const getMemberRoleColor = (member: User) => {
    if (member.id === group?.adminId) return 'text-red-600 bg-red-100';
    if (group?.moderatorIds.includes(member.id)) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Modération - {group?.name || 'Groupe'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Input file caché pour la photo de profil */}
        {canModerate && (
          <input
            id="groupPictureInput"
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            className="hidden"
          />
        )}

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'members' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Membres ({group?.members?.length || 0})
          </button>
          {canModerate && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'settings' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Paramètres
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Informations de debug pour l'admin */}
              {isAdmin && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="font-medium text-blue-800">Mode Administrateur activé</div>
                  <div className="text-blue-600">
                    Vous pouvez promouvoir/rétrograder des modérateurs et exclure des membres.
                  </div>
                </div>
              )}
              
              {isModerator && !isAdmin && (
                <div className="bg-orange-50 p-3 rounded-lg text-sm">
                  <div className="font-medium text-orange-800">Mode Modérateur activé</div>
                  <div className="text-orange-600">
                    Vous pouvez exclure des membres normaux du groupe.
                  </div>
                </div>
              )}
              
              {group.members.map((member: User) => {
                // Debug pour chaque membre
                const memberIsAdmin = member.id === group.adminId;
                const memberIsModerator = group.moderatorIds.includes(member.id);
                const memberIsSelf = member.id === user?.id;
                const canPromote = isAdmin && user && !memberIsSelf && !memberIsAdmin && !memberIsModerator;
                const canDemote = isAdmin && user && !memberIsSelf && !memberIsAdmin && memberIsModerator;
                const canKick = canModerate && user && !memberIsSelf && !memberIsAdmin && (!memberIsModerator || isAdmin);

                return (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {member.profilePicture ? (
                        <img 
                          src={member.profilePicture} 
                          alt={member.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {member.firstName?.[0] || member.username[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.firstName} {member.lastName}</div>
                      <div className="text-sm text-gray-500">@{member.username}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${getMemberRoleColor(member)}`}>
                        {getMemberRole(member)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {/* Boutons de promotion/rétrogradation (Admin uniquement) */}
                    {isAdmin && user && member.id !== user.id && member.id !== group.adminId ? (
                      !group.moderatorIds.includes(member.id) ? (
                        <button
                          onClick={() => handlePromoteModerator(member.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 disabled:opacity-50 text-sm"
                        >
                          👑 Promouvoir
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDemoteModerator(member.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 disabled:opacity-50 text-sm"
                        >
                          📉 Rétrograder
                        </button>
                      )
                    ) : null}

                    {/* Bouton d'exclusion (Admin/Modérateurs) */}
                    {canModerate && user && member.id !== user.id && member.id !== group.adminId && 
                     (!group.moderatorIds.includes(member.id) || isAdmin) ? (
                      <button
                        onClick={() => handleKickMember(member.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 text-sm"
                      >
                        🚫 Exclure
                      </button>
                    ) : null}
                    
                    {/* Debug: Afficher l'état pour comprendre */}
                    {isAdmin && (
                      <div className="text-xs text-gray-500 ml-2">
                        {member.id === user?.id ? 'Vous' : 
                         member.id === group.adminId ? 'Admin' :
                         group.moderatorIds.includes(member.id) ? 'Mod' : 'Membre'}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {activeTab === 'settings' && canModerate && (
            <div className="space-y-6">
              {/* Information sur les permissions */}
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="font-medium text-blue-800">
                  {isAdmin ? 'Mode Administrateur' : 'Mode Modérateur'}
                </div>
                <div className="text-blue-600">
                  {isAdmin ? 'Vous pouvez modifier tous les paramètres du groupe.' : 'Vous pouvez modifier le nom, la description et la photo du groupe.'}
                </div>
              </div>

              {/* Nom du groupe */}
              {canModerate && (
                <div>
                  <h3 className="font-medium mb-3">Nom du groupe</h3>
                  <div className="flex items-center space-x-2">
                    {isEditingName ? (
                      <>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nom du groupe"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateGroupName();
                            } else if (e.key === 'Escape') {
                              setIsEditingName(false);
                              setGroupName(group.name);
                            }
                          }}
                        />
                        <button
                          onClick={handleUpdateGroupName}
                          disabled={loading}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setGroupName(group.name);
                          }}
                          className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-700">{group.name}</span>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Modifier
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description du groupe */}
              {canModerate && (
                <div>
                  <h3 className="font-medium mb-3">Description du groupe</h3>
                  <div className="flex items-start space-x-2">
                    {isEditingDescription ? (
                      <>
                        <textarea
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Description du groupe"
                          rows={3}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleUpdateGroupDescription();
                            } else if (e.key === 'Escape') {
                              setIsEditingDescription(false);
                              setGroupDescription(group.description || '');
                            }
                          }}
                        />
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={handleUpdateGroupDescription}
                            disabled={loading}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingDescription(false);
                              setGroupDescription(group.description || '');
                            }}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-700">
                          {group.description || 'Aucune description'}
                        </span>
                        <button
                          onClick={() => setIsEditingDescription(true)}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Modifier
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Informations du groupe */}
              <div>
                <h3 className="font-medium mb-4">Informations</h3>
                
                {/* Photo de profil dans la section informations */}
                {canModerate && (
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-3">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {group?.profilePicture ? (
                          <img 
                            src={group.profilePicture} 
                            alt={group.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-medium text-gray-600">
                            {group?.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      
                      {/* Bouton de modification comme sur ProfilePage */}
                      <div className="absolute -bottom-2 -right-2">
                        <button
                          onClick={() => document.getElementById('groupPictureInput')?.click()}
                          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                          title="Changer la photo"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Indication de chargement */}
                    {loading && (
                      <div className="text-sm text-gray-500 animate-pulse">
                        Mise à jour en cours...
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Nom du groupe:</strong> {group.name}</div>
                  <div><strong>Description:</strong> {group.description || 'Aucune description'}</div>
                  <div><strong>Créé le:</strong> {new Date(group.createdAt).toLocaleDateString()}</div>
                  <div><strong>Membres:</strong> {group.members.length}</div>
                  <div><strong>Modérateurs:</strong> {group.moderatorIds.length}</div>
                  <div><strong>Type:</strong> {group.isPrivate ? 'Privé' : 'Public'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModerationPanel;

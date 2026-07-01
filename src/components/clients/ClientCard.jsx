import React from 'react';
import { User, Phone, Edit, Trash2, Eye } from 'lucide-react';

export default function ClientCard({ client, onEdit, onDelete, onView }) {
  return (
    <div 
      className="rounded-2xl p-4 border" 
      style={{ 
        background: 'var(--card-bg)', 
        borderColor: 'var(--border)',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Conteúdo */}
      <div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-3">
          <User className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
          {client.name}
        </h3>
        <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Phone className="w-3 h-3" /> {client.phone}
        </p>
      </div>
      
      {/* Botões */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => onView && onView(client)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transition-colors"
          title="Ver detalhes"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onEdit && onEdit(client)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onDelete && onDelete(client)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
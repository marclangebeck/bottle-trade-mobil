import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, doc, query, orderBy, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadProductImages } from '../utils/imageUpload';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  images?: string[];
  createdAt?: any;
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    active: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsQuery = query(collection(db, 'products'), where('active', '==', true), orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Fehler beim Laden der Produkte:', error);
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        .filter((p) => p.active !== false)
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
      setProducts(productsData);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      if (fileArray.length > 5) {
        alert('Maximal 5 Bilder erlaubt');
        return;
      }
      setSelectedImages(fileArray);
      
      // Erstelle Vorschau-URLs
      const previewUrls = fileArray.map((file) => URL.createObjectURL(file));
      // Kombiniere bestehende URLs mit neuen Vorschau-URLs
      setProductImages([...productImages, ...previewUrls]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
    
    // Entferne auch aus selectedImages wenn es eine neue Datei ist
    if (index < selectedImages.length) {
      const newSelected = [...selectedImages];
      newSelected.splice(index, 1);
      setSelectedImages(newSelected);
    }
  };

  const resetForm = () => {
    setProductData({ name: '', description: '', price: '', stock: '', active: true });
    setSelectedImages([]);
    setProductImages([]);
    setIsCreating(false);
    setIsEditing(false);
    setEditingProduct(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateProduct = async () => {
    if (isSubmitting) {
      return;
    }

    if (!productData.name || !productData.description || !productData.price) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsUploading(true);

      // Erstelle Produkt zuerst in Firestore
      const productRef = await addDoc(collection(db, 'products'), {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price.replace(',', '.')),
        stock: parseInt(productData.stock) || 0,
        active: productData.active,
        images: [],
        createdAt: serverTimestamp(),
      });

      const productId = productRef.id;
      console.log('✅ Produkt erstellt:', productId);

      // Lade Bilder hoch, falls vorhanden
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          imageUrls = await uploadProductImages(productId, selectedImages);
          console.log(`✅ ${imageUrls.length} Bilder hochgeladen`);
          
          // Aktualisiere Produkt mit Bild-URLs
          await updateDoc(doc(db, 'products', productId), {
            images: imageUrls,
          });
        } catch (uploadError) {
          console.error('⚠️ Fehler beim Hochladen der Bilder:', uploadError);
          alert('Produkt wurde erstellt, aber Bilder konnten nicht hochgeladen werden.');
        }
      }

      alert(`Produkt wurde erfolgreich erstellt!${imageUrls.length > 0 ? ` (${imageUrls.length} Bilder hochgeladen)` : ''}`);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen des Produkts: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleNewProduct = () => {
    // Setze Formular zurück und öffne für neues Produkt
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditing(true);
    setIsCreating(true);
    setProductData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString().replace('.', ',') : '',
      stock: product.stock ? product.stock.toString() : '',
      active: product.active !== undefined ? product.active : true,
    });
    setProductImages(product.images || []);
    setSelectedImages([]);
  };

  const handleUpdateProduct = async () => {
    if (isSubmitting || !editingProduct) {
      return;
    }

    if (!productData.name || !productData.description || !productData.price) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsUploading(true);

      // Lade neue Bilder hoch, falls vorhanden
      let imageUrls: string[] = [...productImages.filter((url) => url.startsWith('http'))];
      
      if (selectedImages.length > 0) {
        try {
          const uploadedUrls = await uploadProductImages(editingProduct.id, selectedImages);
          imageUrls = [...imageUrls, ...uploadedUrls];
          console.log(`✅ ${uploadedUrls.length} neue Bilder hochgeladen`);
        } catch (uploadError) {
          console.error('⚠️ Fehler beim Hochladen der neuen Bilder:', uploadError);
          alert('Produkt wurde aktualisiert, aber neue Bilder konnten nicht hochgeladen werden.');
        }
      }

      // Aktualisiere Produkt
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price.replace(',', '.')),
        stock: parseInt(productData.stock) || 0,
        active: productData.active,
        images: imageUrls,
        updatedAt: serverTimestamp(),
      });

      alert('Produkt wurde erfolgreich aktualisiert!');
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren des Produkts: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Möchten Sie dieses Produkt wirklich löschen?')) return;
    try {
      await updateDoc(doc(db, 'products', productId), { active: false });
      loadProducts();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Produkts');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Produkte...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Shop-Verwaltung</h1>
        <button
          onClick={() => {
            if (isCreating) {
              resetForm();
            } else {
              handleNewProduct();
            }
          }}
          className="px-4 py-2 bg-gold hover:bg-yellow-600 text-dark-bg rounded-lg font-medium"
        >
          {isCreating ? 'Abbrechen' : '+ Neues Produkt'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {isEditing ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                value={productData.name}
                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Produktname"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Beschreibung *</label>
              <textarea
                value={productData.description}
                onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                rows={3}
                placeholder="Produktbeschreibung"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Preis (€) *</label>
                <input
                  type="text"
                  value={productData.price}
                  onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="19,99"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Lagerbestand</label>
                <input
                  type="number"
                  value={productData.stock}
                  onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Bild-Upload */}
            <div>
              <label className="block text-gray-300 mb-2">Bilder (max. 5)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              {productImages.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-4">
                  {productImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aktive Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={productData.active}
                onChange={(e) => setProductData({ ...productData, active: e.target.checked })}
                className="w-4 h-4 text-gold bg-gray-700 border-gray-600 rounded focus:ring-gold"
              />
              <label htmlFor="active" className="ml-2 text-gray-300">
                Produkt aktiv
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={isEditing ? handleUpdateProduct : handleCreateProduct}
                disabled={isSubmitting || isUploading}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isSubmitting || isUploading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gold hover:bg-yellow-600 text-dark-bg'
                }`}
              >
                {isUploading
                  ? 'Bilder werden hochgeladen...'
                  : isSubmitting
                  ? 'Wird gespeichert...'
                  : isEditing
                  ? 'Produkt aktualisieren'
                  : 'Produkt erstellen'}
              </button>
            <button
                onClick={resetForm}
                disabled={isSubmitting || isUploading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium disabled:opacity-50"
            >
                Abbrechen
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Produkte vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Bild</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Preis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Lager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                        Kein Bild
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{product.price?.toFixed(2)} €</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{product.stock || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.active
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-gray-900/50 text-gray-200'
                      }`}
                    >
                      {product.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        ✏️ Bearbeiten
                      </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      🗑️
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

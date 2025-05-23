import { useState, useEffect } from 'react';

const useHardwareProfile = () => {
  const [hardwareProfile, setHardwareProfile] = useState({
    cpu_cores: 8,
    gpu_vram: 16,
    system_ram: 32,
    gpu_model: "RTX 4070",
    cpu_model: "Ryzen 7"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHardwareProfile = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would call the API endpoint
        // For demonstration, we'll simulate the API call
        const response = await fetch('http://localhost:8000/api/hardware/profile');
        
        if (response.ok) {
          const profile = await response.json();
          setHardwareProfile(profile);
        } else {
          // Fallback to default hardware profile if API call fails
          console.log('Using default hardware profile');
        }
      } catch (err) {
        console.error('Error fetching hardware profile:', err);
        setError(err.message);
        // Use default profile on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchHardwareProfile();
  }, []);

  const updateHardwareProfile = (newProfile) => {
    setHardwareProfile(prev => ({ ...prev, ...newProfile }));
  };

  return {
    hardwareProfile,
    isLoading,
    error,
    updateHardwareProfile
  };
};

export default useHardwareProfile; 
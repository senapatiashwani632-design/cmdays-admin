"use client";

import React from 'react'

const Home = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '50px 60px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#333',
          marginBottom: '10px',
          fontWeight: '700'
        }}>
          Welcome, Admin, CMDAYS
        </h1>
        
        <div style={{
          height: '4px',
          width: '60px',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          margin: '20px auto',
          borderRadius: '2px'
        }}></div>
        
        <p style={{
          color: '#666',
          fontSize: '1rem',
          marginBottom: '35px'
        }}>
          Manage and navigate through the conference portal
        </p>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <h3 style={{
            width: '100%',
            color: '#555',
            marginBottom: '10px',
            fontSize: '1.2rem',
            fontWeight: '500'
          }}>
            Go to:
          </h3>
          
          <a 
            href="/speakers" 
            style={{
              textDecoration: 'none',
              backgroundColor: '#667eea',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '30px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
            }}
          >
            🎤 Speakers
          </a>
          
          <a 
            href="/committee" 
            style={{
              textDecoration: 'none',
              backgroundColor: '#764ba2',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '30px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'inline-block',
              boxShadow: '0 4px 15px rgba(118,75,162,0.4)'
            }}
          >
            👥 Committee
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home
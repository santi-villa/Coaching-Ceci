module.exports = {
    content: [
        './*.html',
        './js/**/*.js',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    lilac: '#b59ad6',
                    pink: '#e8a9c0',
                    peach: '#f4ceb6',
                    text: '#3a2640',
                    light: '#fcfafc',
                    green: '#86d1a4',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #b59ad6 0%, #e8a9c0 50%, #f4ceb6 100%)',
                'book-cover-gradient': 'linear-gradient(180deg, #6cb3e3 0%, #a8cfe8 40%, #bca6db 100%)',
            },
        },
    },
};

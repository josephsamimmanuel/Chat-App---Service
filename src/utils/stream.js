import { StreamChat } from "stream-chat";
import dotenv from 'dotenv';
dotenv.config();

const api_key = process.env.STREAMIFY_API_KEY;
const api_secret = process.env.STREAMIFY_API_SECRET;

if (!api_key || !api_secret) {
    throw new Error("STREAMIFY_API_KEY and STREAMIFY_API_SECRET must be set");
}

const serverClient = StreamChat.getInstance(api_key, api_secret);

// Create or update a user in Stream
export const upsertStreamUser = async (userData) => {
    const { id, name, email, password, username, image, bio, location, nativeLanguage, learningLanguage } = userData;
    
    if (!id) {
        throw new Error('User ID is required for Stream Chat user creation');
    }

    try {
        const streamUser = {
            id: id.toString(), // Ensure ID is a string
            name,
            email,
            password,
            username,
            image,
            bio,
            location,
            nativeLanguage,
            learningLanguage
        };

        await serverClient.upsertUsers([streamUser]);
        return streamUser;
    } catch (error) {
        console.error('Stream Chat upsert error:', error);
        throw error;
    }
};

export const generateStreamToken = (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required for token generation');
        }
        return serverClient.createToken(userId.toString());
    } catch (error) {
        console.error('Stream Chat token generation error:', error);
        throw error;
    }
};
